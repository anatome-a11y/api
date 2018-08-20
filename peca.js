var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = new Schema({
    id: String,
    name: String,
    tags: [{type: String}],
    type: String,
    handle: String,
    url: String
});

var esquemaConteudoTeorico = new Schema({
    id: String,
    partes: [{type: String}],
    midias: [esquemaMidia],
    plural: String,
    singular: String
});

var esquemaParte = new Schema({
    id: String,
    nome: String
});

var esquemaPeca = new Schema({
    id: String,
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