const Peca = require('../models/peca');
const Roteiro = require('../models/roteiro');
const Anatomp = require('../models/anatomp');
const withResumoMidias = require('../utils/midiaUtils')

class RoteiroService {

    async findall(req, res) {
        console.info("findAll roteiros")

        Roteiro.find({})
        .populate({ path: 'conteudos', populate: {path: 'partes'} })
        .populate({path: 'partes'}).lean().exec((err, roteiros) => {
            if (err) return res.status(500).send({status: 500, error: err});

            const _roteiros = roteiros.map(withResumoMidias);

            Peca.find({}).populate({path: 'partes'}).lean().exec((err, pecas) => {
                if (err) return res.status(500).send({status: 500, error: err});

                //Provisório: No futuro, salvar referencia de peça generica dentro de parte
                const data = _roteiros.map(roteiro => {
                    let pecasAnatomp = {};

                    pecas.forEach(peca => {
                        roteiro.partes.forEach(parteAnatomp => {
                            peca.partes.forEach(partePeca => {
                                if(partePeca._id == parteAnatomp._id && !pecasAnatomp.hasOwnProperty(peca._id)){
                                    pecasAnatomp[peca._id] = peca;
                                }
                            })                        
                        })
                    })

                    return {...roteiro, pecasGenericas: Object.values(pecasAnatomp)}
                })       
        
                return res.status(200).send({status: 200, data});
            });        
        });  
    }

    async create(req, res) {
        const roteiro = new Roteiro(req.body)
        roteiro.save((err, _roteiro) => {
            if (err) return res.status(500).send({status: 500, error: err});

            return res.status(200).send({status: 200, data: _roteiro});
        });  
    }

    async delete(req, res) {
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
    }

    async update(req, res) {
        const roteiro = new Roteiro(req.body)
        Roteiro.findByIdAndUpdate(req.params._id, roteiro, (err, _roteiro) => {
            if (err) return res.status(500).send({status: 500, error: err});

            return res.status(200).send({status: 200, data: _roteiro});
        })
    }
}

module.exports = RoteiroService;