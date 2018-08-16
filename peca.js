var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = new Schema({
    id: String,
    name: String,
    tags: [{type: String}],
    type: String,
}, { _id : false });

var esquemaConteudoTeorico = new Schema({
    id: String,
    partes: [{type: String}],
    midias: [esquemaMidia],
    plural: String,
    singular: String
}, { _id : false });

var esquemaParte = new Schema({
    id: String,
    nome: String
}, { _id : false });

var esquemaPeca = new Schema({
    id: String,
    nome: String,
    idioma: String,
    sistema: String,
    regiao: String,
    partes: [esquemaParte],
    conteudoTeorico: [esquemaConteudoTeorico]
}, { _id : false });

var Peca = mongoose.model('Peca', esquemaPeca);   

module.exports = Peca;