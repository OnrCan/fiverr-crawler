const mongoose = require('mongoose');

const { Schema } = mongoose;

const failedRequestSchema = new Schema({
	timeStamp: String,
	type: String,
	url: String,
	proxyIP: String,
	userAgent: String
});

const FailedRequest = mongoose.model('failed-requests', failedRequestSchema);

module.exports = FailedRequest;