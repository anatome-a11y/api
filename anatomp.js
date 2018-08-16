var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMap = new Schema({
    id: String,
    conteudo: String,
    numero: Number,
}, { _id : false });

var esquemaAnatomp = new Schema({
    id: String,
    mapa: [esquemaMap]
}, { _id : false });

var Anatomp = mongoose.model('Anatomp', esquemaAnatomp);   

module.exports = Anatomp;