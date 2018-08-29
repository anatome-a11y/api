var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaPeca = new Schema({
    _id: String,
    nome: String,
    idioma: String,
    sistema: String,
    regiao: String,
    partes: [{ type: String, ref: 'Parte' }],
    conteudoTeorico: [{ type: String, ref: 'ConteudoTeorico' }]
}, {_id: false});


var Peca = mongoose.model('Peca', esquemaPeca);   

module.exports = Peca;