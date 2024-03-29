const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
  "tipe": {
    "type": "Number"
  },
  "id_rekon": {
    "type": "Number"
  },
  "id_rekon_result": {
    "type": "Number"
  },
  "row_data": [
      {"type": "String"}
  ],
  "id_collection": 'String',
  "id_transaksi": Number,
  "id_transaksi_detail": "String"
}, {timestamps: true});

const DataModel = mongoose.model('rekon_match', DataSchema, 'rekon_match');
module.exports = DataModel;