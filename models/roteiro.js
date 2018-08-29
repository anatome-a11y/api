var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaRoteiro = new Schema({
    _id: String,
    nome: String,
    curso: String,
    disciplina: String,
    proposito: String, 
    partes: [[{ type: String, ref: 'Parte' }]],
    conteudos: [{ type : String, ref: 'ConteudoTeorico' }]  
}, {_id: false});

var Roteiro = mongoose.model('Roteiro', esquemaRoteiro);   

module.exports = Roteiro;