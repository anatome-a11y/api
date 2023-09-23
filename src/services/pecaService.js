const Roteiro = require('../models/roteiro');
const Parte = require('../models/parte');
const Peca = require('../models/peca');
const ConteudoTeorico = require('../models/conteudoTeorico');

class PecaService {
    
    async findAll(req, res) {
        console.info("findAll pecas")
        Peca.find({}).populate({ path: 'conteudoTeorico', populate: { path: 'partes'} }).populate({path: 'partes'}).exec((err, pecas) => {
            if (err) return res.status(500).send({status: 500, error: err});

            return res.status(200).send({status: 200, data: pecas});
        });
    }

    async create(req, res) {
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
    }

    async delete(req, res) {
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
    }

    async update(req, res) {
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
    }
}

module.exports = PecaService
