var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaRoteiro = new Schema({
    id: String,
    nome: String,
    curso: String,
    disciplina: String,
    proposito: String, 
    partes: [{ type : Schema.Types.ObjectId, ref: 'Parte' }],
    conteudos: [{ type : Schema.Types.ObjectId, ref: 'ConteudoTeorico' }]  
});

var Roteiro = mongoose.model('Roteiro', esquemaRoteiro);   

module.exports = Roteiro;