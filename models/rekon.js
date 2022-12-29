const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    "id_rekon": {
      "type": "Number"
    },
    "nama_rekon": {
      "type": "String"
    },
    "kolom_compare": { type : Array , "default" : [] },
    "kolom_sum": { type : Array , "default" : [] },
    "timestamp": {
      "type": "String"
    },
    "timestamp_complete": {
      "type": "String"
    },
    "delimiter": {
      "type": "String"
    },
    "is_proses": "String"
  }, {timestamps: true});

const DataModel = mongoose.model('rekon_buff', DataSchema, 'rekon_buff');
module.exports = DataModel;