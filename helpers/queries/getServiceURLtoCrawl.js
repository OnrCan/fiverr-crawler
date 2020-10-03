const chalk = require('chalk');
const log = console.log;

require('../../database');
const {
	ServiceURL
} = require('../../database/Schemas');

const getServiceURLtoCrawl = async (query = {}) => {
	const result = await ServiceURL.find({...query}, (err, urlList) => {
		if (err) return log(chalk.bgRed(`Error on Service URL collection: ` + err));

		return urlList;
	});

	return result;
}

module.exports = getServiceURLtoCrawl;