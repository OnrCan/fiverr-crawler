const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceURLSchema = new Schema({
	timeStamp: String,
	url: String,
	isCrawled: Boolean,
	category: String,
});

const ServiceURL = mongoose.model('service-urls', serviceURLSchema);

module.exports = ServiceURL;