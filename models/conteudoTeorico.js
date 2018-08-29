var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var esquemaMidia = new Schema({
    _id: String,
    name: String,
    tags: [{type: String}],
    type: String,
    handle: String,
    url: String
}, {_id: false});

var esquemaConteudoTeorico = new Schema({
    _id: String,
    partes: [{ type: String, ref: 'Parte' }],
    midias: [esquemaMidia],
    plural: String,
    singular: String
}, {_id: false});

var ConteudoTeorico = mongoose.model('ConteudoTeorico', esquemaConteudoTeorico);    

module.exports = ConteudoTeorico;