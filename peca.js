var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = new Schema({
    name: String,
    tags: [{type: String}],
    type: String,
    handle: String,
    url: String
});

var esquemaConteudoTeorico = new Schema({
    partes: [{type: String}],
    midias: [esquemaMidia],
    plural: String,
    singular: String
});

var esquemaParte = new Schema({
    nome: String
});

var esquemaPeca = new Schema({
    nome: String,
    idioma: String,
    sistema: String,
    regiao: String,
    partes: [esquemaParte],
    conteudoTeorico: [esquemaConteudoTeorico]
});

// mongoose.model('Midia', esquemaMidia);   
mongoose.model('ConteudoTeorico', esquemaConteudoTeorico);   
mongoose.model('Parte', esquemaParte);   
var Peca = mongoose.model('Peca', esquemaPeca);   

module.exports = Peca;