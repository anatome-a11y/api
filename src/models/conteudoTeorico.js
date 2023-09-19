var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = require('../schemas/midia')

var esquemaConteudoTeorico = new Schema({
    _id: String,
    partes: [{ type: String, ref: 'Parte' }],
    midias: [esquemaMidia],
    plural: String,
    singular: String
}, {_id: false});

var ConteudoTeorico = mongoose.model('ConteudoTeorico', esquemaConteudoTeorico);    

module.exports = ConteudoTeorico;