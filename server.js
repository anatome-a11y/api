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

const Peca = require('./models/peca');
const Roteiro = require('./models/roteiro');
const Anatomp = require('./models/anatomp');
const Parte = require('./models/parte');
const ConteudoTeorico = require('./models/conteudoTeorico');
const PecaFisica = require('./models/pecaFisica');

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
    Peca.find({}).populate({ path: 'conteudoTeorico', populate: { path: 'partes'} }).populate({path: 'partes'}).exec((err, pecas) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: pecas});
    });  
});



app.post('/peca', (req, res) => {
    var peca = req.body;
    var partes = req.body.partes.map(c => new Parte(c));
    var conteudo = req.body.conteudoTeorico.map(c => new ConteudoTeorico(c));

    //Salva as partes das peças
    Parte.collection.insert(partes, (err, partes) => {
        if (err) return res.status(500).send({status: 500, error: err});

        peca.partes = peca.partes.map(c => c._id)

        //Salva os conteúdos teóricos
        ConteudoTeorico.collection.insert(conteudo, (err, conteudos) => {
            if (err) return res.status(500).send({status: 500, error: err});
    
            peca.conteudoTeorico = peca.conteudoTeorico.map(c => c._id)
    
            const toSave = new Peca(peca)        
    
            toSave.save((err, _peca) => {
                if (err) return res.status(500).send({status: 500, error: err});
        
                return res.status(200).send({status: 200, data: _peca});
            }); 
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
    Roteiro.find({}).populate({ path: 'conteudos', populate: {path: 'partes'} }).populate({path: 'partes'}).lean().exec((err, roteiros) => {
        if (err) return res.status(500).send({status: 500, error: err});

        const _roteiros = roteiros.map(r => {
            const tiposMidia = r.conteudos.map(c => {
                const arr = c.midias.map(m => m.type);
                return [].concat.apply([], arr)
            });
            const flat = [].concat.apply([], tiposMidia)

            const uniqueMidia = flat.filter(function(item, pos) {
                return flat.indexOf(item) == pos;
            });
            
            return {...r, uniqueMidia};
        });
        

        return res.status(200).send({status: 200, data: _roteiros});
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

app.post('/peca', (req, res) => {
    var peca = req.body;
    var partes = req.body.partes.map(c => new Parte(c));
    var conteudo = req.body.conteudoTeorico.map(c => new ConteudoTeorico(c));

    //Salva as partes das peças
    Parte.collection.insert(partes, (err, partes) => {
        if (err) return res.status(500).send({status: 500, error: err});

        peca.partes = peca.partes.map(c => c._id)

        //Salva os conteúdos teóricos
        ConteudoTeorico.collection.insert(conteudo, (err, conteudos) => {
            if (err) return res.status(500).send({status: 500, error: err});
    
            peca.conteudoTeorico = peca.conteudoTeorico.map(c => c._id)
    
            const toSave = new Peca(peca)        
    
            toSave.save((err, _peca) => {
                if (err) return res.status(500).send({status: 500, error: err});
        
                return res.status(200).send({status: 200, data: _peca});
            }); 
        });
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log("Ouvindo na porta 8080");
});