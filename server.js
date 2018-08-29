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
const ConteudoTeorico = require('./conteudoTeorico');

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
    var peca = req.body;
    var conteudo = req.body.conteudoTeorico.map(c => new ConteudoTeorico(c));

    ConteudoTeorico.collection.insert(conteudo, (err, conteudos) => {
        if (err) return res.status(500).send({status: 500});

        peca.conteudoTeorico = peca.conteudoTeorico.map(c => c._id)

        const toSave = new Peca(peca)        

        toSave.save((err, _peca) => {
            if (err) return res.status(500).send({status: 500, error: err});
    
            return res.status(200).send({status: 200, data: _peca});
        }); 
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
    Roteiro.find({}).exec((err, roteiros) => {
        if (err) return res.status(500).send({status: 500, error: err});

        const _roteiros = roteiros.map(r => {
            const tiposMidia = r.midias.map(m => m.type);

            const uniqueMidia = tiposMidia.filter(function(item, pos) {
                return tiposMidia.indexOf(item) == pos;
            });

            r.tiposMidia = uniqueMidia;
            
            return r;
        });
        

        return res.status(200).send({status: 200, data: _roteiros});
    }).populate({ path: 'conteudos' });  
});

app.get('/roteiro/:_id/partes', (req, res) => {
    Roteiro.findById(req.params._id).exec((err, roteiro) => {
        if (err) return res.status(500).send({status: 500, error: err});

        Peca.find({}, (err, pecas) => {
            if (err) return res.status(500).send({status: 500, error: err});

            const partes = pecas.map(p => p.partes);
            const flat = [].concat.apply([], partes)

            const _partes = flat.filter(f => roteiro.partes.indexOf(f._id) != -1);
    
            return res.status(200).send({status: 200, data: _partes});
        });
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