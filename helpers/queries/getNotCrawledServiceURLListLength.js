const chalk = require('chalk');
const log = console.log;

require('../../database');
const {
	ServiceURL
} = require('../../database/Schemas');

const getNotCrawledServiceURLListLength = async () => {
	const result = await ServiceURL.find({ 'isCrawled': false }, (err, url) => {
		if (err) return log(chalk.bgRed(`Error on Service fetching: ` + err));
		return url.length;
	});

	return result;
}

module.exports = getNotCrawledServiceURLListLength;