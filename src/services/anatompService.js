const Peca = require('../models/peca');
const Roteiro = require('../models/roteiro');
const Anatomp = require('../models/anatomp');
const Parte = require('../models/parte');
const ConteudoTeorico = require('../models/conteudoTeorico');
const PecaFisica = require('../models/pecaFisica');
const withResumoMidias = require('../utils/midiaUtils')
const { apagarArquivosLivres } = require('../utils/arquivoMidia')
const { falha, registrarInfo } = require('../utils/log')

const baseDoArquivo = valor => {
    const texto = String(valor || '').split('?')[0].split('/').pop();
    if (!texto || texto === '.' || texto === '..') return '';
    try {
        return decodeURIComponent(texto);
    } catch (err) {
        return texto;
    }
};

const guardarMidia = (nomes, midia) => {
    if (!midia) return;
    [midia.name, midia.url].forEach(valor => {
        const nome = baseDoArquivo(valor);
        if (nome) nomes.add(nome);
    });
};

const nomesDosArquivos = (anatomp, pecas) => {
    const nomes = new Set();
    (anatomp.generalidades || []).forEach(item => {
        (item.midias || []).forEach(midia => guardarMidia(nomes, midia));
    });
    (pecas || []).forEach(peca => {
        (peca.midias || []).forEach(midia => guardarMidia(nomes, midia));
    });
    return nomes;
};

const arquivoAindaUsado = nome => {
    const citado = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const url = { $regex: citado };
    const naMidia = { $or: [{ 'midias.name': nome }, { 'midias.url': url }] };
    const naGeneralidade = { $or: [{ 'generalidades.midias.name': nome }, { 'generalidades.midias.url': url }] };
    return Promise.all([
        PecaFisica.findOne(naMidia).select('_id').lean(),
        Anatomp.findOne(naGeneralidade).select('_id').lean(),
        Roteiro.findOne(naGeneralidade).select('_id').lean(),
        ConteudoTeorico.findOne(naMidia).select('_id').lean(),
    ]).then(achados => achados.some(Boolean));
};

class AnatompService {

    async findAll(req, res) {
        console.info("findAll anatomp")
        Anatomp.find({})
        .populate({path: 'roteiro', populate: [{path: 'conteudos', populate: {path: 'partes'}}, {path: 'partes'}]})
        .populate({path: 'pecasFisicas'})    
        .populate({ path: 'mapa.parte' })
        .populate({ path: 'mapa.localizacao.pecaFisica' })
        .populate({ path: 'mapa.localizacao.referenciaRelativa.referencia' })
        .lean()
        .exec((err, anatomps) => {
            if (err) return falha(res, 'AnatompService', err);

            let _anatomps = anatomps.map(a => ({
                ...a,
                roteiro: withResumoMidias(a.roteiro)
            }))

            Peca.find({}).populate({path: 'partes'}).lean().exec((err, pecas) => {
                if (err) return falha(res, 'AnatompService', err);

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
            if (err) return falha(res, 'AnatompService', err);

            anatomp.pecasFisicas = anatomp.pecasFisicas.map(c => c._id)

            const toSave = new Anatomp(anatomp)        

            toSave.save((err, _anatomp) => {
                if (err) return falha(res, 'AnatompService', err);
        
                return res.status(200).send({status: 200, data: _anatomp});
            }); 
        });    
    }

    async update(req, res) {
        var anatomp = req.body;
        var pecasFisicas = req.body.pecasFisicas;


        pecasFisicas.forEach(p => {
            PecaFisica.findByIdAndUpdate(p._id, p, {upsert: true}, (err, _pf) => {
                if (err) return falha(res, 'AnatompService', err);
            })
        })
        
        anatomp.pecasFisicas = pecasFisicas.map(c => c._id)

        Anatomp.findByIdAndUpdate(anatomp._id, anatomp, (err, _peca) => {
            if (err) return falha(res, 'AnatompService', err);

            return res.status(200).send({status: 200, data: _peca});
        })
    }

  async delete(req, res) {
    try {
        const anatomp = await Anatomp.findById(req.params._id).lean();
        if (!anatomp) {
            return res.status(404).send({ status: 404, error: 'Roteiro setado não encontrado.' });
        }
        const ids = anatomp.pecasFisicas || [];
        const pecas = ids.length ? await PecaFisica.find({ _id: { $in: ids } }).lean() : [];
        const nomes = nomesDosArquivos(anatomp, pecas);

        const removido = await Anatomp.findByIdAndRemove(req.params._id);
        if (!removido) {
            return res.status(404).send({ status: 404, error: 'Roteiro setado não encontrado.' });
        }
        if (ids.length) {
            await PecaFisica.deleteMany({ _id: { $in: ids } });
        }
        const apagados = await apagarArquivosLivres(nomes, arquivoAindaUsado);
        registrarInfo('AnatompService delete arquivos', { roteiro: String(anatomp._id), apagados });
        return res.status(200).send({ status: 200, data: removido });
    } catch (err) {
        return falha(res, 'AnatompService', err);
    }
  }

}

module.exports = AnatompService;