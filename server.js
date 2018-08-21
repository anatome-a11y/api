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
const Roteiro = require('./roteiro');
const Anatomp = require('./anatomp');

//API

//Tentativa de evitar 304
app.disable('etag');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


//PEÇA
app.get('/peca', (req, res) => {
    Peca.find({}, (err, pecas) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: pecas});
    });  
});



app.post('/peca', (req, res) => {
    const peca = new Peca(req.body)
    peca.save((err, _peca) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _peca});
    }); 
});




app.delete('/peca/:_id', (req, res) => {
    Peca.findByIdAndRemove(req.params._id, (err, _peca) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _peca});
    })
});



app.put('/peca/:_id', (req, res) => {
    const peca = new Peca(req.body)
    Peca.findByIdAndUpdate(req.params._id, peca, (err, _peca) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _peca});
    })
});


//ROTEIRO
app.get('/roteiro', (req, res) => {
    Roteiro.find({}).populate({path: 'conteudos', model: 'ConteudoTeorico'}).exec((err, roteiros) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: roteiros});
    });  
});

app.post('/roteiro', (req, res) => {
    const roteiro = new Roteiro(req.body)
    roteiro.save((err, _roteiro) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _roteiro});
    }); 
});

app.delete('/roteiro/:_id', (req, res) => {
    Roteiro.findByIdAndRemove(req.params._id, (err, _roteiro) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _roteiro});
    })
});



app.put('/roteiro/:_id', (req, res) => {
    const roteiro = new Roteiro(req.body)
    Roteiro.findByIdAndUpdate(req.params._id, roteiro, (err, _roteiro) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _roteiro});
    })
});


//AN@TOMP
app.get('/anatomp', (req, res) => {
    Anatomp.find({}, (err, anatomps) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: anatomps});
    });  
});

app.listen(process.env.PORT || 8080, () => {
    console.log("Ouvindo na porta 8080");
});