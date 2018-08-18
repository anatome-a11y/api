var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMap = new Schema({
    id: String,
    conteudo: String,
    numero: Number,
});

var esquemaAnatomp = new Schema({
    id: String,
    mapa: [esquemaMap]
});

var Anatomp = mongoose.model('Anatomp', esquemaAnatomp);   

module.exports = Anatomp;