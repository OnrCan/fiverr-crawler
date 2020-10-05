const chalk = require('chalk');
const log = console.log;

require('../../database');
const {
	ServiceURL
} = require('../../database/Schemas');

const getServiceURLtoCrawl = async (query = {}) => {
	const result = await ServiceURL.findOne({...query}, (err, url) => {
		if (err) return log(chalk.bgRed(`Error on Service URL fetching: ` + err));
		return url;
	});

	return result;
}

module.exports = getServiceURLtoCrawl;