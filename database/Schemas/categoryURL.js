const mongoose = require('mongoose');

const { Schema } = mongoose;

const categoryURLSchema = new Schema({
  url: String
});

const CategoryURL = mongoose.model('CategoryURL', categoryURLSchema);

module.exports = CategoryURL;