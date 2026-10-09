const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const routes = express.Router();

const uploadsDir = path.resolve(__dirname, '../uploads');
const allowedExtensions = new Set(['png', 'jpg', 'jpeg', 'glb', 'gltf', 'obj']);
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
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).send({ status: 413, error: 'O arquivo excede o limite de 200 MB.' });
            }
            return res.status(400).send({ status: 400, error: 'Arquivo ausente ou formato não suportado.' });
        }
        return next();
    });
}, (req, res) => {
    if (!req.file) {
        return res.status(400).send({ status: 400, error: 'Arquivo ausente ou formato não suportado.' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
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