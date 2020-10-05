const mongoose = require('mongoose');

const { Schema } = mongoose;

const categoryURLSchema = new Schema({
  url: String,
  isCrawled: Boolean,
  page: Number
});

const CategoryURL = mongoose.model('category-url', categoryURLSchema);

module.exports = CategoryURL;