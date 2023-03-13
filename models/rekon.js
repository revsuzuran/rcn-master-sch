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
    "is_proses": "String",
    "id_channel": "String",
    "is_schedule": "Number",
    "detail_schedule" : {
      "nama_rekon" : "String",
        "opt_channel" : "String",
        "waktu_rekon" : "String",
        "data_satu" : {
            "tipe" : "String",
            "koneksi" : "String",
            "input" : "String",
            "setting" : "String",
        }, 
        "data_dua" : {
            "tipe" : "String",
            "koneksi" : "String",
            "input" : "String",
            "setting" : "String"
        }
    }
  }, {timestamps: true});

const DataModel = mongoose.model('rekon_buff', DataSchema, 'rekon_buff');
module.exports = DataModel;