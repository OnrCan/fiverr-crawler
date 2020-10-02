const chalk = require('chalk');
const log = console.log;

require('../../database');
const {
	CategoryURL
} = require('../../database/Schemas');

const getCategoryURL = async (query = {}) => {
	const result = await CategoryURL.find({...query}, (err, urlList) => {
		if (err) return log(chalk.bgRed(`CategoryURL table couldn't be prepared for the run: ` + err));

		return urlList;
	});

	return result;
}

module.exports = getCategoryURL;