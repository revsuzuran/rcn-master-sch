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
    "id_rekon": {
      "type": "Number"
    }
  }, {timestamps: true});

const DataModel = mongoose.model('rekon_buff_detail', DataSchema, 'rekon_buff_detail');
module.exports = DataModel;