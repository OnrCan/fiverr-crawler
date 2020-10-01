const mongoose = require('mongoose');

const { Schema } = mongoose;

const categoryURLSchema = new Schema({
  url: String,
  isCrawled: Boolean
});

const CategoryURL = mongoose.model('category-url', categoryURLSchema);

module.exports = CategoryURL;