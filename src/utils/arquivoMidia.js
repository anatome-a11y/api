const fs = require('fs');
const mongoose = require('mongoose');
const { registrarErro } = require('./log');

const bucketName = 'midias';

const opcoesMongo = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 0,
    family: 4
};

const erroDeConexao = err => {
    const texto = String(err && (err.message || err));
    return /no connection available|ECONNRESET|ECONNREFUSED|ETIMEDOUT|topology|disconnected|not connected|pool/i.test(texto);
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
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
};

const gravar = file => new Promise((resolve, reject) => {
    let encerrado = false;
    const falhar = err => {
        if (encerrado) return;
        encerrado = true;
        reject(err);
    };

    const bucket = getBucket();
    const upload = bucket.openUploadStream(file.filename, {
        contentType: file.mimetype,
        metadata: { originalName: file.originalname }
    });

    fs.createReadStream(file.path)
        .on('error', falhar)
        .pipe(upload)
        .on('error', falhar)
        .on('finish', () => {
            if (encerrado) return;
            encerrado = true;
            resolve(upload);
        });
});

const salvarNoMongo = async file => {
    let ultimoErro;
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
        try {
            await garantirConexao();
            return await gravar(file);
        } catch (err) {
            ultimoErro = err;
            registrarErro('gridfs gravacao', err, { arquivo: file.filename, tentativa });
            if (tentativa === 2 || !erroDeConexao(err)) {
                throw err;
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    throw ultimoErro;
};

module.exports = { opcoesMongo, garantirConexao, getBucket, salvarNoMongo };
