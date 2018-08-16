//SERVIDOR
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//BANCO DE DADOS
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://doc-marcia:1qa2ws3ed@ds121382.mlab.com:21382/doc_marcia')
.then(() => {
    console.log("Conexão realizada com sucesso!");    
}).catch(err => {
    console.log('Não foi possível conectar ao banco de dados');
    process.exit();
});

const Peca = require('./peca');

//API

app.get('/peca', (req, res) => {
    Peca.find({}, (err, pessoas) => {
        if (err) return res.status(500).send({status: 500});

        return res.status(200).send({pessoas});
    });  
});


app.post('/peca', (req, res) => {
    const peca = new Peca(req.body)
    peca.save((err, _peca) => {
        if (err) return res.status(500).send({status: 500});

        return res.status(200).send({_peca});
    }); 
});


app.listen(process.env.PORT || 8080, () => {
    console.log("Ouvindo na porta 8080");
});