const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataSchema = new Schema({
  "tipe": {
    "type": "Number"
  },
  "id_rekon": {
    "type": "Number"
  },
  "row_data": [
      {"type": "String"}
  ]
}, {timestamps: true});

const DataModel = mongoose.model('rekon_match', DataSchema, 'rekon_match');
module.exports = DataModel;