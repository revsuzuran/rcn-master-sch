const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    "id_rekon": {
      "type": "Number"
    },
    "tipe": {
        "type": "Number"
      },
    "nama_rekon": {
      "type": "String"
    },
    "sum_result": [
        {
            "total" : "String",
            "total_match" : "String",
            "total_unmatch" : "String",
            "total" : "String",
            "kolom_name" : "String",
            "kolom_index" : "Number"
        }
    ],
    "timestamp": {
      "type": "String"
    },
    "compare_result": {
      "total_data": {
        "type": "Number"
      },
      "total_match": {
        "type": "Number"
      },
      "total_unmatch": {
        "type": "Number"
      }
    }
  }, {timestamps: true});

const DataModel = mongoose.model('rekon_result', DataSchema, 'rekon_result');
module.exports = DataModel;