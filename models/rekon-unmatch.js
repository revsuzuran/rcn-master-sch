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
  ]
}, {timestamps: true});

const DataModel = mongoose.model('rekon_unmatch', DataSchema, 'rekon_unmatch');
module.exports = DataModel;