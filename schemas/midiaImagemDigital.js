var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    pontos: [],
}, { _id: false });

module.exports = esquemaMidia;