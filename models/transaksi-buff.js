const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    "_id": {
      "type": "ObjectId"
    },
    "nama_transaksi": {
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
    "is_proses": "String",
    "id_collection" : "String",     
    "id_transaksi" : Number, 
    "id_mitra" : Number, 
  }, {timestamps: true});

const DataModel = mongoose.model('transaksi_buff', DataSchema, 'transaksi_buff');
module.exports = DataModel;
