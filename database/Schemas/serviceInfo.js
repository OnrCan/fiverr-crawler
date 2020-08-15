const mongoose = require('mongoose');

const { Schema } = mongoose;

const serviceInfoSchema = new Schema({
	category: String,
	title: String,
	ordersInQueue: String
});

const ServiceInfo = mongoose.model('ServiceURL', serviceInfoSchema);

module.exports = ServiceInfo;