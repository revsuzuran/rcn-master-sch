const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    "id_rekon": {
      "type": "Number"
    },
    "tipe": {
        "type": "Number"
      },
    "id_rekon_result": {
        "type": "Number"
    },
    "nama_rekon": {
      "type": "String"
    },
    "sum_result": {
      "total_sum": {
        "type": "Number"
      },
      "total_sum_match": {
        "type": "Number"
      },
      "total_sum_unmatch": {
        "type": "Number"
      }
    }  
    ,
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
    },
    "id_channel" : "String",
    "fee_detail" : {
      "fee1" : {
        "nilai" : Number,
        "total" : Number
      },
      "fee2" : {
        "nilai" : Number,
        "total" : Number
      },
      "fee3" : {
        "nilai" : Number,
        "total" : Number
      },
      "fee4" : {
        "nilai" : Number,
        "total" : Number
      },
      "fee5" : {
        "nilai" : Number,
        "total" : Number
      },
      "fee_company" : {
        "nilai" : Number,
        "total" : Number
      },
      "fee_admin" : {
        "nilai" : Number,
        "total" : Number
      },
    }
  }, {timestamps: true});

const DataModel = mongoose.model('rekon_result', DataSchema, 'rekon_result');
module.exports = DataModel;