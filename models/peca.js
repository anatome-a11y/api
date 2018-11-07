var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaGeneralidade = require('../schemas/generalidade')

var esquemaPeca = new Schema({
    _id: String,
    nome: String,
    sistema: String,
    regiao: String,
    partes: [{ type: String, ref: 'Parte' }],
    conteudoTeorico: [{ type: String, ref: 'ConteudoTeorico' }],
    generalidades: [esquemaGeneralidade]
}, {_id: false});


var Peca = mongoose.model('Peca', esquemaPeca);   

module.exports = Peca;