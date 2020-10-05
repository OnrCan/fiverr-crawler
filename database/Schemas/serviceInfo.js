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

const ServiceInfo = mongoose.model('service-information', serviceInfoSchema);

module.exports = ServiceInfo;