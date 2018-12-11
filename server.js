//SERVIDOR
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}));

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


const withResumoMidias = r => {
    const tiposMidia = r.conteudos.map(c => {
        const arr = c.midias.map(m => m.type);
        return [].concat.apply([], arr)
    });
    const flat = [].concat.apply([], tiposMidia)

    const resumoMidias = flat.filter(function(item, pos) {
        return flat.indexOf(item) == pos;
    });
    
    return {...r, resumoMidias};
}

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

    Peca.findById(req.params._id, (err, peca) => {
        Roteiro.find({}, (err, roteiros) => {
            const achou = roteiros.filter(r => r.partes.some(id => peca.partes.indexOf(id) >= 0));

            if(achou.length > 0){
                const nomes = achou.map(r => r.nome).join(', ');
                return res.status(500).send({status: 500, error: 'Não é possível excluir a peça, pois a mesma possui partes utilizadas nos roteiros '+nomes+'.'}); 
            }else{
                Peca.findByIdAndRemove(req.params._id, (err, _peca) => {
                    if (err) return res.status(500).send({status: 500, error: err});

                    Parte.remove({_id: {$in: _peca.partes}}, err => {
                        if (err) return res.status(500).send({status: 500, error: err});

                        ConteudoTeorico.remove({_id: {$in: _peca.conteudoTeorico}}, err => {
                            if (err) return res.status(500).send({status: 500, error: err});

                            return res.status(200).send({status: 200, data: _peca});
                        })                        
                    })   
                })
            }           
        })         
    })
});



app.put('/peca/:id', (req, res) => {
    var peca = req.body;
    var partes = req.body.partes;
    var conteudo = req.body.conteudoTeorico;


    partes.forEach(p => {
        Parte.findByIdAndUpdate(p._id, p, {upsert: true}, (err, _parte) => {
            if (err) return res.status(500).send({status: 500, error: err});
        })
    })

    conteudo.forEach(p => {
        ConteudoTeorico.findByIdAndUpdate(p._id, p, {upsert: true}, (err, _conteudo) => {
            if (err) return res.status(500).send({status: 500, error: err});
        })
    })   
    
    peca.partes = partes.map(c => c._id)
    peca.conteudoTeorico = conteudo.map(c => c._id)    

    Peca.findByIdAndUpdate(peca._id, peca, (err, _peca) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _peca});
    })
});


//ROTEIRO
app.get('/roteiro', (req, res) => {
    Roteiro.find({})
    .populate({ path: 'conteudos', populate: {path: 'partes'} })
    .populate({path: 'partes'}).lean().exec((err, roteiros) => {
        if (err) return res.status(500).send({status: 500, error: err});

        const _roteiros = roteiros.map(withResumoMidias);

        //Provisório: No futuro, salvar referencia de peça generica dentro de parte
        const data = _roteiros.map(roteiro => {
            let pecasAnatomp = {};
            roteiro.partes.forEach(parteAnatomp => {
                peca.partes.forEach(partePeca => {
                    if(partePeca._id == parteAnatomp._id && !pecasAnatomp.hasOwnProperty(peca._id)){
                        pecasAnatomp[peca._id] = peca;
                    }
                })                        
            })
            
            return {...roteiro, pecasGenericas: Object.values(pecasAnatomp)}                        
        })
        

        return res.status(200).send({status: 200, data});
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
    Anatomp.find({roteiro: req.params._id}, (err, anatomps) => {
        if(anatomps.length > 0){
            const nomes = anatomps.map(a => a.nome).join(', ');
            return res.status(401).send({status: 401, error: 'Não é possível excluir o roteiro, pois o mesmo está vinculado às Anatoms '+nomes+'.'}); 
        }else{
            Roteiro.findByIdAndRemove(req.params._id, (err, _roteiro) => {
                if (err) return res.status(500).send({status: 500, error: err});
        
                return res.status(200).send({status: 200, data: _roteiro});
            })
        }
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
    Anatomp.find({})
    .populate({path: 'roteiro', populate: [{path: 'conteudos', populate: {path: 'partes'}}, {path: 'partes'}]})
    .populate({path: 'pecasFisicas'})    
    .populate({ path: 'mapa.parte' })
    .populate({ path: 'mapa.localizacao.pecaFisica' })
    .populate({ path: 'mapa.localizacao.referenciaRelativa.referencia' })
    .lean()
    .exec((err, anatomps) => {
        if (err) return res.status(500).send({status: 500, error: err});

        let _anatomps = anatomps.map(a => ({
            ...a,
            roteiro: withResumoMidias(a.roteiro)
        }))

        Peca.find({}).populate({path: 'partes'}).lean().exec((err, pecas) => {
            if (err) return res.status(500).send({status: 500, error: err});

            //Provisório: No futuro, salvar referencia de peça generica dentro de parte
            const data = _anatomps.map(anatomp => {
                let pecasAnatomp = {};

                pecas.forEach(peca => {
                    anatomp.roteiro.partes.forEach(parteAnatomp => {
                        peca.partes.forEach(partePeca => {
                            if(partePeca._id == parteAnatomp._id && !pecasAnatomp.hasOwnProperty(peca._id)){
                                pecasAnatomp[peca._id] = peca;
                            }
                        })                        
                    })
                })

                return {...anatomp, roteiro: {...anatomp.roteiro, pecasGenericas: Object.values(pecasAnatomp)}}
            })           
    
            return res.status(200).send({status: 200, data});
        });        
    });  
});

app.post('/anatomp', (req, res) => {
    var anatomp = req.body;
    var pecasFisicas = req.body.pecasFisicas.map(c => new PecaFisica(c));

    PecaFisica.collection.insert(pecasFisicas, (err, pecasFisicas) => {
        if (err) return res.status(500).send({status: 500, error: err});

        anatomp.pecasFisicas = anatomp.pecasFisicas.map(c => c._id)

        const toSave = new Anatomp(anatomp)        

        toSave.save((err, _anatomp) => {
            if (err) return res.status(500).send({status: 500, error: err});
    
            return res.status(200).send({status: 200, data: _anatomp});
        }); 
    });    
});


app.put('/anatomp/:id', (req, res) => {
    var anatomp = req.body;
    var pecasFisicas = req.body.pecasFisicas;


    pecasFisicas.forEach(p => {
        PecaFisica.findByIdAndUpdate(p._id, p, {upsert: true}, (err, _pf) => {
            if (err) return res.status(500).send({status: 500, error: err});
        })
    })
    
    anatomp.pecasFisicas = pecasFisicas.map(c => c._id)

    Anatomp.findByIdAndUpdate(anatomp._id, anatomp, (err, _peca) => {
        if (err) return res.status(500).send({status: 500, error: err});

        return res.status(200).send({status: 200, data: _peca});
    })
});



app.delete('/anatomp/:_id', (req, res) => {
    Anatomp.findByIdAndRemove(req.params._id, (err, _anatomp) => {
        if (err) return res.status(500).send({status: 500, error: err});

        PecaFisica.remove({_id: {$in: _anatomp.pecasFisicas}}, err => {
            if (err) return res.status(500).send({status: 500, error: err});

            return res.status(200).send({status: 200, data: _anatomp});
        })       
        
    })
});




app.listen(process.env.PORT || 8080, () => {
    console.log("Ouvindo na porta 8080");
});