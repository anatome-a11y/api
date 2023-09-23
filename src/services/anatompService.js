const Peca = require('../models/peca');
const Roteiro = require('../models/roteiro');
const Anatomp = require('../models/anatomp');
const Parte = require('../models/parte');
const ConteudoTeorico = require('../models/conteudoTeorico');
const PecaFisica = require('../models/pecaFisica');
const withResumoMidias = require('../utils/midiaUtils')

class AnatompService {

    async findAll(req, res) {
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
    }

    async create(req, res) {
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
    }

    async update(req, res) {
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
    }

  async delete(req, res) {
    Anatomp.findByIdAndRemove(req.params._id, (err, _anatomp) => {
        if (err) return res.status(500).send({status: 500, error: err});

        PecaFisica.remove({_id: {$in: _anatomp.pecasFisicas}}, err => {
            if (err) return res.status(500).send({status: 500, error: err});

            return res.status(200).send({status: 200, data: _anatomp});
        })       
    })
  }

}

module.exports = AnatompService;