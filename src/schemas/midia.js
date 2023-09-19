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

module.exports = esquemaMidia;