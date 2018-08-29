var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaParte = new Schema({
    _id: String,
    nome: String
}, {_id: false});


var Parte = mongoose.model('Parte', esquemaParte);   

module.exports = Parte;