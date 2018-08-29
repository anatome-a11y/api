var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaParte = new Schema({
    _id: String,
    nome: String
}, {_id: false});

var esquemaPeca = new Schema({
    _id: String,
    nome: String,
    idioma: String,
    sistema: String,
    regiao: String,
    partes: [esquemaParte],
    conteudoTeorico: [{ type: String, ref: 'ConteudoTeorico' }]
}, {_id: false});


var Peca = mongoose.model('Peca', esquemaPeca);   

module.exports = Peca;