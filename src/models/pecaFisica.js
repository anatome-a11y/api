var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var midiaImagemDigital = require('../schemas/midiaImagemDigital')

var esquemaPecaFisica = new Schema({
    _id: String,
    nome: String,
    descricao: String,
    pecaGenerica: { type: String, ref: 'Peca' },
    midias: [midiaImagemDigital],
}, {_id: false});


var PecaFisica = mongoose.model('PecaFisica', esquemaPecaFisica);   

module.exports = PecaFisica;