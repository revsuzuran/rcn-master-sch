const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const dataDetail = {
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
}


const DataSchema = new Schema({
  "_id": {
    "type": "ObjectId"
  },
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
    "time" : "String"
  },
  "id_rekon_result" : Number,
  "data_result1" : dataDetail,
  "data_result2" : dataDetail
}, {timestamps: true});

const DataModel = mongoose.model('rekon_result', DataSchema, 'rekon_result');
module.exports = DataModel;