const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceURLSchema = new Schema({
	timeStamp: String,
	categoryURL: String,
	url: String
});

const ServiceURL = mongoose.model('ServiceURL', serviceURLSchema);

module.exports = ServiceURL;