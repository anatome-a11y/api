var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaGeneralidade = require('../schemas/generalidade')

var esquemaReferenciaRelativa = new Schema({
    _id: String,
    referenciaParaReferenciado: String,
    referenciadoParaReferencia: String,
    referencia: { type: String, ref: 'Parte' }
}, {_id: false});

var esquemaLocalizacao = new Schema({
    _id: String,
    pecaFisica: {type : String, ref: 'PecaFisica'},
    numero: String,
    referenciaRelativa: esquemaReferenciaRelativa
}, {_id: false});

var esquemaPonto = new Schema({
    _id: String,
    label: { type: String },
    parte: { type: String, ref: 'Parte' },
    x: String,
    y: String
}, { _id: false });

var esquemaMap = new Schema({
    _id: String,
    parte: { type: String, ref: 'Parte' },
    localizacao: [esquemaLocalizacao],
    pontos: []
}, { _id: false });

var esquemaAnatomAv = new Schema({
    _id: String,
    titulo: String,
    subtitulo: String,
    instrucoes: String,
    disciplina: String,
    turma: String,
    roteiro: { type : String, ref: 'Roteiro' },    
    pecasFisicas: [{type: String, ref: 'PecaFisica'}],
    mapa: [esquemaMap],
    generalidades: [esquemaGeneralidade],
    tipoPecaMapeamento: String
}, {_id: false});

var AnatomAv = mongoose.model('AnatomAv', esquemaAnatomAv);   

module.exports = AnatomAv;