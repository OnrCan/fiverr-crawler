const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceInfoSchema = new Schema({
	category: String,
	title: String,
	ordersInQueue: String
});

const ServiceInfo = mongoose.model('ServiceInfo', serviceInfoSchema);

module.exports = ServiceInfo;