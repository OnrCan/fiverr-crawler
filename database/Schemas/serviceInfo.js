const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceInfoSchema = new Schema({
	timeStamp: String,
	category: String,
	subCategory: String,
	title: String,
	ordersInQueue: String,
	url: String
});

const ServiceInfo = mongoose.model('ServiceInfo', serviceInfoSchema);

module.exports = ServiceInfo;