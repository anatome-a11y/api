var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaPecaFisica = new Schema({
    _id: String,
    nome: String,
    descricao: String,
}, {_id: false});


var PecaFisica = mongoose.model('PecaFisica', esquemaPecaFisica);   

module.exports = PecaFisica;