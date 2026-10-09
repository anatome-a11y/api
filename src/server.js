//SERVIDOR
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes')
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
// O Render encerra o HTTPS no proxy. Sem isso, req.protocol fica "http".
app.set('trust proxy', 1);

const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Configurar o middleware CORS para aceitar chamadas de qualquer origem
app.use(cors());

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}));

//ENVIRONMENT
require('dotenv').config()

//BANCO DE DADOS
const mongoose = require('mongoose');
const { opcoesMongo } = require('./utils/arquivoMidia');

mongoose.Promise = global.Promise;

const { registrarErro, registrarInfo, detalheDe } = require('./utils/log');

mongoose.connect(process.env.MONGO_DB, opcoesMongo)
.then(() => {
    registrarInfo('mongodb', { estado: 'conectado', readyState: mongoose.connection.readyState });
}).catch(err => {
    registrarErro('mongodb conexao', err);
    process.exit();
});

mongoose.connection.on('error', err => registrarErro('mongodb', err));
mongoose.connection.on('disconnected', () => registrarInfo('mongodb', { estado: 'desconectado', readyState: mongoose.connection.readyState }));
mongoose.connection.on('reconnected', () => registrarInfo('mongodb', { estado: 'reconectado', readyState: mongoose.connection.readyState }));

process.on('unhandledRejection', err => registrarErro('unhandledRejection', err));
process.on('uncaughtException', err => registrarErro('uncaughtException', err));

// Utiliza arquivos com as rotas mapeadas
app.use(routes);

//Tentativa de evitar 304
app.disable('etag');

//API
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((err, req, res, next) => {
    registrarErro(`${req.method} ${req.path}`, err);
    if (res.headersSent) {
        return next(err);
    }
    return res.status(500).send({ status: 500, error: 'Erro interno', detalhe: detalheDe(err) });
});

app.listen(process.env.PORT || 8080, () => {
    registrarInfo('servidor', { porta: process.env.PORT || 8080 });
});