const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { getBucket, salvarNoMongo } = require('./utils/arquivoMidia');
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
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).slice(1).toLowerCase();
        callback(null, allowedExtensions.has(extension));
    }
});

routes.post('/midia', (req, res, next) => {
    upload.single('file')(req, res, error => {
        if (error) {
            registrarErro('POST /midia upload', error, { codigo: error.code });
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).send({ status: 413, error: 'O arquivo excede o limite de 200 MB.' });
            }
            return res.status(400).send({ status: 400, error: 'Arquivo ausente ou formato não suportado.', detalhe: detalheDe(error) });
        }
        return next();
    });
}, (req, res) => {
    if (!req.file) {
        registrarInfo('POST /midia recusado', { motivo: 'arquivo ausente ou extensão não permitida' });
        return res.status(400).send({ status: 400, error: 'Arquivo ausente ou formato não suportado.' });
    }

    const arquivo = {
        nome: req.file.filename,
        original: req.file.originalname,
        tipo: req.file.mimetype,
        bytes: req.file.size,
        mongo: mongoose.connection.readyState
    };
    registrarInfo('POST /midia recebido', arquivo);

    salvarNoMongo(req.file)
        .then(() => {
            fs.unlink(req.file.path, () => {});
            const url = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
            registrarInfo('POST /midia armazenado', { ...arquivo, url });
            return res.status(201).send({
                status: 201,
                data: {
                    name: req.file.filename,
                    originalName: req.file.originalname,
                    type: req.file.mimetype,
                    url
                }
            });
        })
        .catch(error => {
            fs.unlink(req.file.path, () => {});
            registrarErro('POST /midia armazenamento', error, arquivo);
            return res.status(500).send({
                status: 500,
                error: 'Não foi possível armazenar o arquivo.',
                detalhe: detalheDe(error)
            });
        });
});

routes.get('/uploads/:filename', (req, res) => {
    let bucket;
    try {
        bucket = getBucket();
    } catch (error) {
        registrarErro('GET /uploads', error, { nome: req.params.filename });
        return res.status(503).send({ status: 503, error: 'Banco de dados indisponível', detalhe: detalheDe(error) });
    }

    bucket.find({ filename: req.params.filename }).toArray((err, files) => {
        if (err) {
            registrarErro('GET /uploads consulta', err, { nome: req.params.filename });
            return res.status(500).send({ status: 500, error: 'Não foi possível ler o arquivo.', detalhe: detalheDe(err) });
        }
        if (!files || files.length === 0) {
            registrarInfo('GET /uploads ausente', { nome: req.params.filename });
            return res.status(404).send({ status: 404, error: 'Arquivo não encontrado' });
        }

        const arquivo = files[0];
        res.set('Content-Type', arquivo.contentType || 'application/octet-stream');
        res.set('Content-Length', arquivo.length);
        res.set('Cache-Control', 'public, max-age=31536000');

        const download = bucket.openDownloadStreamByName(req.params.filename);
        download.on('error', error => {
            registrarErro('GET /uploads download', error, { nome: req.params.filename });
            if (!res.headersSent) {
                res.status(404).end();
            } else {
                res.end();
            }
        });
        download.pipe(res);
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