var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaLocalizacao = new Schema({
    _id: String,
    pecaFisica: {type : Schema.Types.ObjectId, ref: 'PecaFisica'},
    anterior: String,
    posterior: String,
    latDir: String,
    latEsq: String,
    medDir: String,
    medEsq: String,
    superior: String,
    inferior: String,
}, {_id: false});

var esquemaMap = new Schema({
    _id: String,
    parte: {type : Schema.Types.ObjectId, ref: 'Parte'},
    numero: Number,
    localizacao: [esquemaLocalizacao],
    pecasFisicas:[{type: String}]
}, {_id: false});

var esquemaPecaFisica = new Schema({
    _id: String,
    nome: String,
    descricao: String,
}, {_id: false});

var esquemaAnatomp = new Schema({
    _id: String,
    nome: String,
    instituicao: String,
    roteiro: { type : Schema.Types.ObjectId, ref: 'Roteiro' },
    pecasFisicas: [esquemaPecaFisica],
    mapa: [esquemaMap]
}, {_id: false});

var Anatomp = mongoose.model('Anatomp', esquemaAnatomp);   

module.exports = Anatomp;