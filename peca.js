var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = new Schema({
    name: String,
    tags: [{type: String}],
    type: String,
    handle: String,
    url: String
}, {_id: false});

var esquemaConteudoTeorico = new Schema({
    partes: [{type: String}],
    midias: [esquemaMidia],
    plural: String,
    singular: String
}, {_id: false});

var esquemaParte = new Schema({
    nome: String
}, {_id: false});

var esquemaPeca = new Schema({
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