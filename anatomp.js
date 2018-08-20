var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaLocalizacao = new Schema({
    anterior: String,
    posterior: String,
    latDir: String,
    latEsq: String,
    medDir: String,
    medEsq: String,
    superior: String,
    inferior: String,
});

var esquemaMap = new Schema({
    id: String,
    parte: String,
    numero: Number,
    localizacao: esquemaLocalizacao
});

var esquemaPecaFisica = new Schema({
    id: String,
    nome: String,
    descricao: String,
});

var esquemaAnatomp = new Schema({
    id: String,
    nome: String,
    instituicao: String,
    roteiro: { type : Schema.Types.ObjectId, ref: 'Roteiro' },
    pecasFisicas: [esquemaPecaFisica],
    mapa: [esquemaMap]
});

var Anatomp = mongoose.model('Anatomp', esquemaAnatomp);   

module.exports = Anatomp;