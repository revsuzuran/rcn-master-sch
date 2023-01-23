const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    "_id": {
      "type": "ObjectId"
    },
    "id_mitra" : Number,
    "nama_channel" : "String",
    "fee1" : {
        "nilai" : Number,
        "is_prosentase" : Number
    },
    "fee2" : {
        "nilai" : Number,
        "is_prosentase" : Number
    },
    "fee3" : {
        "nilai" : Number,
        "is_prosentase" : Number
    },
    "fee4" : {
        "nilai" : Number,
        "is_prosentase" : Number
    },
    "fee5" : {
        "nilai" : Number,
        "is_prosentase" : Number
    },
    "fee_admin" : {
        "nilai" : Number,
        "is_prosentase" : Number
    }
  }, {timestamps: true});

const DataModel = mongoose.model('channel_data', DataSchema, 'channel_data');
module.exports = DataModel;