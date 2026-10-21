const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getBucket, garantirConexao, GridFsStorage } = require('./utils/arquivoMidia');
const { registrarErro, registrarInfo, detalheDe } = require('./utils/log');
const mongoose = require('mongoose');
const routes = express.Router();

const uploadsDir = path.resolve(__dirname, '../uploads');
const allowedExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp',
    'glb', 'gltf', 'obj', 'mtl',
    'mp3', 'wav', 'ogg', 'm4a', 'mp4', 'webm',
    'pdf', 'doc', 'docx', 'xls', 'xlsx'
]);
const upload = multer({
    storage: new GridFsStorage(),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).slice(1).toLowerCase();
        callback(null, allowedExtensions.has(extension));
    }
});

routes.post('/midia', (req, res, next) => {
    upload.single('file')(req, res, error => {
        if (error) {
            if (res.headersSent || req.aborted) return;
            registrarErro('POST /midia upload', error, { codigo: error.code });
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).send({ status: 413, error: 'O arquivo excede o limite de 200 MB.' });
            }
            const limite = error.code && String(error.code).indexOf('LIMIT') === 0;
            const status = limite ? 400 : 500;
            return res.status(status).send({
                status,
                error: limite ? 'Arquivo ausente ou formato não suportado.' : 'Não foi possível armazenar o arquivo.',
                detalhe: detalheDe(error)
            });
        }
        return next();
    });
}, (req, res) => {
    if (!req.file) {
        registrarInfo('POST /midia recusado', { motivo: 'arquivo ausente ou extensão não permitida' });
        return res.status(400).send({ status: 400, error: 'Arquivo ausente ou formato não suportado.' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
    const arquivo = {
        arquivo: req.file.filename,
        original: req.file.originalname,
        tipo: req.file.mimetype,
        bytes: req.file.size,
        mongo: mongoose.connection.readyState,
        url
    };
    registrarInfo('POST /midia armazenado', arquivo);
    return res.status(201).send({
        status: 201,
        data: {
            name: req.file.filename,
            originalName: req.file.originalname,
            type: req.file.mimetype,
            url
        }
    });
});

const intervaloDe = (cabecalho, total) => {
    if (!cabecalho) return null;
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(cabecalho).trim());
    if (!match || (match[1] === '' && match[2] === '')) return { invalido: true };

    let start;
    let end;
    if (match[1] === '') {
        const ultimos = Number(match[2]);
        start = Math.max(total - ultimos, 0);
        end = total;
    } else {
        start = Number(match[1]);
        end = match[2] === '' ? total : Number(match[2]) + 1;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || end <= start) {
        return { invalido: true };
    }
    return { start, end: Math.min(end, total) };
};

const prepararResposta = (res, total, intervalo) => {
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (!intervalo) {
        res.set('Content-Length', total);
        return {};
    }
    if (intervalo.invalido) {
        res.status(416);
        res.set('Content-Range', `bytes */${total}`);
        return { invalido: true };
    }
    res.status(206);
    res.set('Content-Range', `bytes ${intervalo.start}-${intervalo.end - 1}/${total}`);
    res.set('Content-Length', intervalo.end - intervalo.start);
    return { start: intervalo.start, end: intervalo.end };
};

routes.get('/uploads/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const noDisco = path.join(uploadsDir, filename);

    if (fs.existsSync(noDisco)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(noDisco);
    }

    garantirConexao()
        .then(() => getBucket())
        .then(bucket => new Promise((resolve, reject) => {
            bucket.find({ filename }).toArray((err, files) => {
                if (err) reject(err);
                else resolve({ bucket, files });
            });
        }))
        .then(({ bucket, files }) => {
            if (!files || files.length === 0) {
                registrarInfo('GET /uploads ausente', { arquivo: filename, disco: false, gridfs: false });
                return res.status(404).send({ status: 404, error: 'Arquivo não encontrado' });
            }

            const arquivo = files[0];
            const total = arquivo.length;
            const faixa = prepararResposta(res, total, intervaloDe(req.headers.range, total));
            if (faixa.invalido) return res.end();

            res.set('Content-Type', arquivo.contentType || 'application/octet-stream');
            const download = bucket.openDownloadStreamByName(filename, {
                start: faixa.start,
                end: faixa.end
            });
            download.on('error', error => {
                registrarErro('GET /uploads download', error, { arquivo: filename });
                if (!res.headersSent) {
                    res.status(404).end();
                } else {
                    res.end();
                }
            });
            download.pipe(res);
        })
        .catch(error => {
            registrarErro('GET /uploads', error, { arquivo: filename, mongo: mongoose.connection.readyState });
            return res.status(503).send({ status: 503, error: 'Banco de dados indisponível', detalhe: detalheDe(error) });
        });
});

//PEÇA
const PecaService = require('./services/pecaService');
const pecasService = new PecaService()

routes.get('/peca', pecasService.findAll);
routes.post('/peca', pecasService.create);
routes.put('/peca/:id', pecasService.update);
routes.delete('/peca/:_id', pecasService.delete);

//ROTEIRO
const RoteiroService = require('./services/roteiroService');
const roteirosService = new RoteiroService()

routes.get('/roteiro', roteirosService.findall);
routes.post('/roteiro', roteirosService.create);
routes.put('/roteiro/:_id', roteirosService.update);
routes.delete('/roteiro/:_id', roteirosService.delete);

//AN@TOMP
const AnatompService = require('./services/anatompService');
const anatompService = new AnatompService()

routes.get('/anatomp', anatompService.findAll);
routes.post('/anatomp', anatompService.create);
routes.put('/anatomp/:id', anatompService.update);
routes.delete('/anatomp/:_id', anatompService.delete);

module.exports = routes;