//SERVIDOR
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes')
const cors = require('cors');

const app = express();

// Configurar o middleware CORS para aceitar chamadas de qualquer origem
app.use(cors());

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}));

//ENVIRONMENT
require('dotenv').config()

//BANCO DE DADOS
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_DB)
.then(() => {
    console.log("Conexão realizada com sucesso!");    
}).catch(err => {
    console.log('Não foi possível conectar ao banco de dados' + err);
    process.exit();
});

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

app.listen(process.env.PORT || 8080, () => {
    console.log("Ouvindo na porta 8080");
});