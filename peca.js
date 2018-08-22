var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = new Schema({
    _id: String,
    name: String,
    tags: [{type: String}],
    type: String,
    handle: String,
    url: String
}, {_id: false});

var esquemaConteudoTeorico = new Schema({
    _id: String,
    partes: [{type: String}],
    midias: [esquemaMidia],
    plural: String,
    singular: String
}, {_id: false});

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
    conteudoTeorico: [esquemaConteudoTeorico]
}, {_id: false});

mongoose.model('Midia', esquemaMidia);   
mongoose.model('ConteudoTeorico', esquemaConteudoTeorico);   
mongoose.model('Parte', esquemaParte);   
var Peca = mongoose.model('Peca', esquemaPeca);   

module.exports = Peca;