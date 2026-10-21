const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { registrarErro, registrarInfo } = require('./log');

const bucketName = 'midias';
const CHUNK_SIZE = 4 * 1024 * 1024;
const RECOMPACTAR_A_PARTIR_DE = 1024 * 1024;

const opcoesMongo = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 0,
    family: 4
};

const garantirConexao = () => new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        resolve();
        return;
    }

    const timeout = setTimeout(() => {
        limpar();
        reject(new Error('MongoDB não reconectou a tempo'));
    }, 20000);

    const aoConectar = () => {
        limpar();
        resolve();
    };
    const aoFalhar = err => {
        limpar();
        reject(err);
    };
    const limpar = () => {
        clearTimeout(timeout);
        mongoose.connection.removeListener('connected', aoConectar);
        mongoose.connection.removeListener('reconnected', aoConectar);
        mongoose.connection.removeListener('error', aoFalhar);
    };

    mongoose.connection.once('connected', aoConectar);
    mongoose.connection.once('reconnected', aoConectar);
    mongoose.connection.once('error', aoFalhar);

    if (mongoose.connection.readyState === 0) {
        mongoose.connect(process.env.MONGO_DB, opcoesMongo).catch(aoFalhar);
    }
});

const getBucket = () => {
    if (!mongoose.connection.db) {
        throw new Error('Banco de dados indisponível');
    }
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName,
        chunkSizeBytes: CHUNK_SIZE
    });
};

const nomeArquivo = original => {
    const extensao = path.extname(original || '').toLowerCase();
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensao}`;
};

const listarArquivos = bucket => new Promise((resolve, reject) => {
    bucket.find({}).sort({ uploadDate: -1 }).toArray((err, arquivos) => {
        if (err) reject(err);
        else resolve(arquivos || []);
    });
});

const apagarArquivo = (bucket, id) => new Promise((resolve, reject) => {
    bucket.delete(id, err => (err ? reject(err) : resolve()));
});

const abortar = upload => {
    if (!upload || upload.state.aborted || upload.state.streamEnd) return;
    upload.abort(() => {});
};

// O corpo da requisição entra no GridFS enquanto o cliente ainda envia.
// O bloco de 4 MB reduz um arquivo de 39 MB de ~157 documentos para cerca de 10.
function GridFsStorage() {}

GridFsStorage.prototype._handleFile = function (req, file, cb) {
    if (file.stream.destroyed) {
        cb(new Error('Envio interrompido'));
        return;
    }

    const filename = nomeArquivo(file.originalname);
    let encerrado = false;
    let upload = null;

    const concluir = (err, info) => {
        if (encerrado) return;
        encerrado = true;
        if (err) cb(err);
        else cb(null, info);
    };

    const falhar = err => {
        if (file.stream && file.stream.unpipe && upload) file.stream.unpipe(upload);
        if (file.stream && !file.stream.destroyed && file.stream.destroy) file.stream.destroy();
        abortar(upload);
        concluir(err);
    };

    const gravar = () => {
        upload = getBucket().openUploadStream(filename, {
            chunkSizeBytes: CHUNK_SIZE,
            contentType: file.mimetype,
            metadata: { originalName: file.originalname }
        });
        file._upload = upload;
        file.id = upload.id;
        file.filename = filename;

        file.stream.on('error', falhar);
        upload.on('error', falhar);
        upload.on('finish', () => {
            concluir(null, {
                filename,
                size: upload.length,
                id: upload.id
            });
        });
        file.stream.pipe(upload);
    };

    req.on('aborted', () => falhar(new Error('Envio cancelado')));

    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        try {
            gravar();
        } catch (err) {
            falhar(err);
        }
        return;
    }

    file.stream.pause();
    garantirConexao()
        .then(() => {
            gravar();
            file.stream.resume();
        })
        .catch(falhar);
};

GridFsStorage.prototype._removeFile = function (req, file, cb) {
    const upload = file._upload;
    const pronto = () => cb(null);
    if (upload && !upload.state.streamEnd && !upload.state.aborted) {
        upload.abort(pronto);
        return;
    }
    if (!file.id || !mongoose.connection.db) {
        pronto();
        return;
    }
    apagarArquivo(getBucket(), file.id).then(pronto).catch(pronto);
};

const copiarComBlocoMaior = arquivo => new Promise((resolve, reject) => {
    const bucket = getBucket();
    const leitura = bucket.openDownloadStream(arquivo._id);
    const escrita = bucket.openUploadStream(arquivo.filename, {
        chunkSizeBytes: CHUNK_SIZE,
        contentType: arquivo.contentType,
        metadata: arquivo.metadata
    });
    let encerrado = false;

    const falhar = err => {
        if (encerrado) return;
        encerrado = true;
        if (leitura.destroy) leitura.destroy();
        abortar(escrita);
        reject(err);
    };

    leitura.on('error', falhar);
    escrita.on('error', falhar);
    escrita.on('finish', () => {
        if (encerrado) return;
        apagarArquivo(bucket, arquivo._id)
            .then(() => {
                if (encerrado) return;
                encerrado = true;
                resolve();
            })
            .catch(err => {
                if (encerrado) return;
                encerrado = true;
                reject(err);
            });
    });
    leitura.pipe(escrita);
});

// Arquivos já gravados em blocos de 255 KB continuam lentos para baixar.
// Regrava em segundo plano só os que passam de 1 MB, mantendo o mesmo nome.
const recompactarGrandes = () => garantirConexao()
    .then(() => listarArquivos(getBucket()))
    .then(arquivos => {
        const vistos = new Set();
        const pendentes = [];
        arquivos.forEach(arquivo => {
            if (!arquivo || vistos.has(arquivo.filename)) return;
            vistos.add(arquivo.filename);
            if (!arquivo.length || arquivo.length < RECOMPACTAR_A_PARTIR_DE) return;
            if (arquivo.chunkSize >= CHUNK_SIZE) return;
            pendentes.push(arquivo);
        });
        return pendentes.reduce((fila, arquivo) => fila.then(() => {
            registrarInfo('gridfs recompactar', { arquivo: arquivo.filename, bytes: arquivo.length, blocoAntes: arquivo.chunkSize });
            return copiarComBlocoMaior(arquivo).then(() => {
                registrarInfo('gridfs recompactado', { arquivo: arquivo.filename, bytes: arquivo.length, bloco: CHUNK_SIZE });
            }).catch(err => registrarErro('gridfs recompactar', err, { arquivo: arquivo.filename }));
        }), Promise.resolve());
    })
    .catch(err => registrarErro('gridfs recompactar', err));

module.exports = {
    opcoesMongo,
    garantirConexao,
    getBucket,
    GridFsStorage,
    recompactarGrandes,
    CHUNK_SIZE
};
