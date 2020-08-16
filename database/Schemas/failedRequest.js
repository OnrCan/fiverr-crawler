const mongoose = require('mongoose');

const { Schema } = mongoose;

const failedRequestSchema = new Schema({
	type: String,
	categoryURL: String,
	url: String,
	proxyIP: String,
	userAgent: String
});

const FailedRequest = mongoose.model('FailedRequest', failedRequestSchema);

module.exports = FailedRequest;