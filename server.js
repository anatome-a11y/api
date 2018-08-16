//SERVIDOR
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//BANCO DE DADOS
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://cartao-todos:1qa2ws3ed@ds235239.mlab.com:35239/cartao_de_todos')
.then(() => {
    console.log("Conexão realizada com sucesso!");    
}).catch(err => {
    console.log('Não foi possível conectar ao banco de dados');
    process.exit();
});

const Peca = require('./peca');

//API


const isValid = val => val != undefined && val != null && (typeof val === 'string' && val.trim() != "")


app.get('/peca', (req, res) => {
    Pessoa.find({}, (err, pessoas) => {
        if (err) return res.status(500).send({status: 500});

        return res.status(200).send({pessoas});
    });  
});


app.post('/pessoas', (req, res) => {

    if(req.body.hasOwnProperty('pessoas') && Array.isArray(req.body.pessoas)){
        req.body.pessoas.every(r => {
            Pessoa.collection.insert(req.body.pessoas, err => {
                if (err) return res.status(500).send({status: 500});
        
                return res.status(200).send({status: 200});
            }); 
        })
    }else{
        return res.status(400).send({status: 400, body: req.body});
    }
});


app.listen(process.env.PORT || 8080, () => {
    console.log("Ouvindo na porta 8080");
});