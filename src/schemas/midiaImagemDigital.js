var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// malha identifica a malha do arquivo. faces são os triângulos de uma área
// fechada. recorte é essa área já cortada no contorno. traco é a curva.
// strict: false preserva campos antigos dos pontos já gravados.
var esquemaPontoMidia = new Schema({
    x: Schema.Types.Mixed,
    y: Schema.Types.Mixed,
    z: Schema.Types.Mixed,
    label: Schema.Types.Mixed,
    parte: Schema.Types.Mixed,
    malha: String,
    malhas: [String],
    faces: Schema.Types.Mixed,
    recorte: Schema.Types.Mixed,
    traco: Schema.Types.Mixed,
}, { _id: false, strict: false });

var esquemaMidia = new Schema({
    _id: String,
    name: String,
    tags: [{ type: String }],
    type: String,
    handle: String,
    url: String,
    img: String,
    referencia: String,
    vista: String,
    pontos: [esquemaPontoMidia],
}, { _id: false });

module.exports = esquemaMidia;