const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
    "_id": {
      "type": "ObjectId"
    },
    "row_index": {
      "type": "Number"
    },
    "data_asli": {
      "type": "String"
    },
    "data_row": {
      "type": [
        "String"
      ]
    },
    "tipe": {
      "type": "String"
    },
    "id_transaksi": {
      "type": "Number"
    },
    "id_collection": {
      "type": "String"
    },
    "is_found": {
      "type": Boolean
    },
    "tanggal_transaksi": {
      "type": "String"
    },
    "id_rekon_result": Number,
  }, {timestamps: true});

const DataModel = mongoose.model('transaksi_detail', DataSchema, 'transaksi_detail');
module.exports = DataModel;