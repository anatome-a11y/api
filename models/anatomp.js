var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaGeneralidade = require('../schemas/generalidade')

var esquemaReferenciaRelativa = new Schema({
    _id: String,
    anterior: String,
    posterior: String,
    latDir: String,
    latEsq: String,
    medDir: String,
    medEsq: String,
    superior: String,
    inferior: String,    
}, {_id: false});

var esquemaLocalizacao = new Schema({
    _id: String,
    pecaFisica: {type : String, ref: 'PecaFisica'},
    numero: String,
    referenciaRelativa: [esquemaReferenciaRelativa]
}, {_id: false});

var esquemaMap = new Schema({
    _id: String,
    parte: {type : String, ref: 'Parte'},
    localizacao: [esquemaLocalizacao],
}, {_id: false});

var esquemaAnatomp = new Schema({
    _id: String,
    nome: String,
    roteiro: { type : String, ref: 'Roteiro' },    
    instituicao: String,
    pecasFisicas: [{type: String, ref: 'PecaFisica'}],
    mapa: [esquemaMap],
    generalidades: [esquemaGeneralidade]
}, {_id: false});

var Anatomp = mongoose.model('Anatomp', esquemaAnatomp);   

module.exports = Anatomp;