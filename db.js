const mongoose = require('mongoose');

(async () => {

	try {
		mongoose.connect('mongodb://149.28.58.54:27017/fiverr-crawler', { useNewUrlParser: true, useUnifiedTopology: true });

		const db = mongoose.connection;
		db.once('open', _ => {
			console.log('Database connected:', "mongodb://149.28.58.54:27017/fiverr-crawler")
		})

		db.on('error', err => {
			console.error('connection error:', err)
		})

		const serviceURLSchema = new mongoose.Schema({
			categoryURL: String,
			url: String
		});
		const ServiceURL = mongoose.model('ServiceURL', serviceURLSchema);
		const serviceURLItem = new ServiceURL({
			categoryURL: "https://fiverr.com",
			url: "logo-design"
		});

		serviceURLItem.save(function (err, serviceURLItem) {
			if (err) return console.error(err);
		});

		// db.close();
	} catch (error) {
		console.log(error);
		process.exit();
	}

})()