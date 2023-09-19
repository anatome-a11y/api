var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaGeneralidade = require('../schemas/generalidade')

var esquemaRoteiro = new Schema({
    _id: String,
    idioma: String,
    nome: String,
    curso: String,
    disciplina: String,
    proposito: String, 
    partes: [{ type: String, ref: 'Parte' }],
    conteudos: [{ type : String, ref: 'ConteudoTeorico' }],
    generalidades: [esquemaGeneralidade] 
}, {_id: false});

var Roteiro = mongoose.model('Roteiro', esquemaRoteiro);   

module.exports = Roteiro;