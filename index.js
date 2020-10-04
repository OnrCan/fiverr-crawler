const chalk = require('chalk');
const log = console.log;

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const moment = require('moment');
var shell = require('shelljs');

// MongoDB
require('./database');
const {
	ServiceURL,
	CategoryURL,
	ServiceInfo,
	FailedRequest
} = require('./database/Schemas');

var { getCategoryURL, getServiceURLtoCrawl } = require('./helpers/queries');

// Utils
const getRandomProxy = require('./helpers/getRandomProxy').getRandomProxy;
const getRandomUserAgent = require('./helpers/getRandomUserAgent').getRandomUserAgent;

// Sleep
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Category URL List
const categoryURLs = require('./CategoryList');

// GLOBALS
let PROXY = null,
	BROWSER = undefined,
	BROWSER_EXIST = false,
	PAGE = undefined,

	lastProxyIndex = undefined,
	userAgent = '',
	tryAgain = false,
	pageNumber = 0

/**
 * 
 * Here we check several things;
 * 
 * #1 Is category-url table has documents?
 * 	#1.1 (Yes) - continue;
 * 	#1.2 (No) - put the @categoryURLs into category-url table
 * 
 */
const prepareCategoryURLTable = async () => {
	let dbList = await getCategoryURL();

	// If there is not any record, put @categoryURLs into table
	if (dbList.length == categoryURLs.length) {
		
		log(chalk.bgGreenBright(chalk.black(`DB record count and the provided list's length are the same. No need to add more url.`)));
		await sleep(1000);
		
	} else {
		// Purge existing documents
		await CategoryURL.deleteMany({}, (err, result) => {
			log(`Category URL collection purged`);
		});

		// Add the urls
		await putCategoryURLs(categoryURLs);

		// Check the lengths to be sure that all save operations are successful.
		dbList = await getCategoryURL();
		dbList.length == categoryURLs.length
			? log(chalk.green(`URLs have been inserted into table`))
			: log(chalk.bgRed(chalk.black(`Something went wrong while inserting category urls`)));
	}
}

/**
 * Insert Category URLs gathered from the module into DB.category-urls
 * 
 * @param {Array} urlList Array for category urls
 * @returns void
*/
const putCategoryURLs = async (urlList) => {
	for (let i = 0; i < urlList.length; i++) {
		let url = urlList[i];
		let record = new CategoryURL({
			'url': url,
			'isCrawled': false
		});
		let saved = await record.save();

		log(chalk.yellow(`Category URL's been saved: ${saved}\n${i + 1}/${urlList.length}`));
	}
}

/**
 * Insert Serive URLs into DB.service-urls
 * 
 * @param {Array} urlList Array for service url(s)
 * @param {Object} category Object for the Category that service url(s) belong(s) to
 */
const putServiceURLs = async (urlList, category) => {
	for (let i = 0; i < urlList.length; i++) {
		let serviceUrl = urlList[i];
		let record = new ServiceURL({
			'timeStamp': moment().format("DD-MM-YYYY hh:mm a"),
			'url': serviceUrl,
			'isCrawled': false,
			'category': category.id
		});
		let saved = await record.save();

		log(chalk.bgYellow(chalk.black(`Service URL's been saved: ${saved}\n${i + 1}/${urlList.length}`)));
	}
}

/**
 * Initialize Puppeteer with Stealth Plugin
 * 
 * @returns {Promise}
 */
const initializePuppeteer = async () => {
	return new Promise((resolve) => {
		try {
			puppeteer.use(StealthPlugin());
			resolve();
		} catch (error) {
			console.error(`Puppeteer couldn't be initialized!`);
			process.exit();
		}
	});
};

/**
 * Initialize a new __headless__ browser.
 * If there is already one, kill it.
 * Set Proxy credentials
 * 
 * @param {Boolean} newProxyCredentials Is new proxy credentials needed?
 */
const setBrowser = async (newProxyCredentials = true) => {

	// IF THERE IS AN EXISTING BROWSER, KILL IT
	if (BROWSER_EXIST) {
		await BROWSER.close();
		shell.exec('pkill chrome');
	}
	
	if (newProxyCredentials) {
		// SET PROXY CREDENTIALS
		PROXY = lastProxyIndex
			? await getRandomProxy(lastProxyIndex)
			: await getRandomProxy();
		lastProxyIndex = PROXY.index;
	}

	// LAUNCH BROWSER WITH PROXY CREDENTIALS
	BROWSER = await puppeteer.launch({
		headless: false,
		args: [`--proxy-server=${PROXY.ip}:${PROXY.port}`]
	});

	BROWSER_EXIST = true;
}

/**
 * Initialize a new tab in the browser.
 * If there is not an existing browser, it calls setBrowser() to initialize.
 */
const setPage = async () => {
	if(!BROWSER_EXIST) {
		await setBrowser(true);
	}
	
	PAGE = await BROWSER.newPage();
	
	await PAGE.authenticate({
		username: PROXY.username,
		password: PROXY.password
	});

	userAgent = await getRandomUserAgent();
	await PAGE.setUserAgent(`${userAgent}`);
}

(async () => {
	await prepareCategoryURLTable();
	await initializePuppeteer();

	// Query the not crawled records
	let categories = await getCategoryURL({ 'isCrawled': false });

	// Informative message
	log(chalk.bgGreenBright(chalk.black(`Crawling is starting...\n++++++++++++++++++++++++`)));
	await sleep(3000);

	// Loop through all the urls and collect all the services urls' under them
	await crawlServiceURLs(categories);

	// if (serviceURLList.length) {
	// 	serviceURLList.forEach(url => {
	// 		let serviceURLItem = new ServiceURL({
	// 			timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
	// 			categoryURL: `${categoryURL}`,
	// 			url: `${url}`
	// 		});
	// 		serviceURLItem.save(function (err, serviceURLItem) {
	// 			if (err) return console.error(err);
	// 			console.log(url, ' — service url added');
	// 		});
	// 	});

	// 	for (let k = 0; k < serviceURLList.length; k++) {
	// 		serviceURL = serviceURLList[k];
	// 		do {
	// 			proxy = lastProxyIndex
	// 				? await getRandomProxy(lastProxyIndex)
	// 				: await getRandomProxy();
	// 			lastProxyIndex = proxy.index;

	// 			browser = await puppeteer.launch({
	// 				headless: true,
	// 				args: [
	// 					`--proxy-server=${proxy.ip}:${proxy.port}`
	// 				]
	// 			});
	// 			page = await browser.newPage();
	// 			await page.authenticate({
	// 				username: proxy.username,
	// 				password: proxy.password
	// 			});

	// 			userAgent = await getRandomUserAgent();
	// 			await page.setUserAgent(`${userAgent}`);
	// 			try {
	// 				await page.goto(`https://www.fiverr.com${serviceURL}`, { waitUntil: 'load', timeout: 0 });

	// 				let serviceInfo = await page.evaluate(() => {
	// 					let category = [...document.querySelectorAll('.breadcrumbs a')]
	// 						.map(el => el.innerText);
	// 					let title = document.querySelector('h1').innerText;
	// 					let ordersInQueue = document.querySelector('.orders-in-queue')
	// 						? document.querySelector('.orders-in-queue').innerText.split(' ')[0]
	// 						: "0";

	// 					return {
	// 						category: category[0],
	// 						subCategory: category[1],
	// 						title: title,
	// 						ordersInQueue: ordersInQueue
	// 					}
	// 				});

	// 				if (serviceInfo.title == "One Small Step" || serviceInfo.title == "Access Denied") { // Banned
	// 					let failedRequestItem = new FailedRequest({
	// 						timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
	// 						type: 'service',
	// 						categoryURL: categoryURL,
	// 						url: `https://www.fiverr.com${serviceURL}`,
	// 						proxyIP: `${proxy.ip}:${proxy.port}`,
	// 						userAgent: `${userAgent}`,
	// 						reason: `banned`
	// 					});

	// 					failedRequestItem.save(function (err, failedRequestItem) {
	// 						if (err) return console.error(err);
	// 						console.log(failedRequestItem, ' — failed request info added (banned)');
	// 					});

	// 					tryAgain = true;
	// 					continue;

	// 				} else {
	// 					tryAgain = false;
	// 					let serviceInfoItem = new ServiceInfo({
	// 						timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
	// 						category: serviceInfo.category,
	// 						subCategory: serviceInfo.subCategory,
	// 						title: serviceInfo.title,
	// 						ordersInQueue: serviceInfo.ordersInQueue,
	// 						url: `https://www.fiverr.com${serviceURL}`
	// 					});

	// 					serviceInfoItem.save(function (err, serviceInfoItem) {
	// 						if (err) return console.error(err);
	// 						console.log(serviceInfoItem, ' — service info added');
	// 					});
	// 					break;
	// 				}
	// 			} catch (error) {
	// 				let failedRequestTimeoutService = new FailedRequest({
	// 					timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
	// 					type: 'service',
	// 					categoryURL: categoryURL,
	// 					url: `https://www.fiverr.com${serviceURL}`,
	// 					proxyIP: `${proxy.ip}:${proxy.port}`,
	// 					userAgent: `${userAgent}`,
	// 					reason: `timeout`
	// 				});

	// 				failedRequestTimeoutService.save(function (err, failedRequestTimeoutService) {
	// 					if (err) return console.error(err);
	// 					console.log(failedRequestTimeoutService, ' — failed request info added (timeout)');
	// 				});
	// 				tryAgain = true;
	// 				continue;
	// 			}
	// 		} while (true)
	// 		await page.waitFor(process.env.WAIT_PAGE_DELAY || 8000)
	// 		await page.close();
	// 		await browser.close();
	// 		shell.exec('pkill chrome');
	// 	}
	// } else {
	// 	let failedRequestItem = new FailedRequest({
	// 		timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
	// 		type: 'category',
	// 		categoryURL: categoryURL,
	// 		proxyIP: `${proxy.ip}:${proxy.port}`,
	// 		userAgent: `${userAgent}`,
	// 		reason: `No more services, or banned ip`
	// 	});

	// 	failedRequestItem.save(function (err, failedRequestItem) {
	// 		if (err) return console.error(err);
	// 		console.log(failedRequestItem, ' — failed request info added (No more services, or banned ip)');
	// 	});
	// 	continue; // No more services, or banned ip then go to the next category
	// }

	console.log("==============================")
	console.log("CRAWLING FINISHED!")
	console.log("==============================")
})().then(process.exit);

const crawlServiceURLs = async (categories) => {
	for (let i = 0; i < categories.length; i++) {

		// Little logging
		let category = categories[i]
		log(chalk.bgWhite(chalk.black(category)));

		// Iterate through service pages until ends
		do {
			if (!tryAgain) {
				pageNumber++;
				categoryURL = `${category.url}?page=${pageNumber}`;
				log(chalk.bgRgb(148,0,211)(`Scraping: ${categoryURL}`));
			}

			await setBrowser(true);
			await setPage();

			try {
				await PAGE.goto(`${categoryURL}`, { waitUntil: 'load', timeout: 0 });
				tryAgain = false; // We assume the page succesfully loaded, ban check is made later
			} catch (error) {
				logFailedRequest('Category', { url: categoryURL, categoryID: category.id });
				tryAgain = true;
				continue; // No more services, or banned ip then go to the next category
			}

			moreService = await PAGE.evaluate(() => {
				let elements = document.querySelectorAll('a.media');

				if (typeof elements !== "undefined" && elements.length !== 0) {
					return [...elements].map(item => item.getAttribute('href'));
				} else {

					if (!document.querySelector('h1')) { // NO HEADING IN THE PAGE MEANS THERE IS NOT SUCH PAGE
						return 'can';
					} else {
						if (document.querySelector('h1').innerText == "One Small Step"
							|| document.querySelector('h1').innerText == "Access Denied") { // Banned
							return 'banned';
						}
					}
				}
			});

			if (!moreService) {
				log(chalk.red('no more service'));
				break;
			}
			else {
				if (moreService == 'banned') {
					tryAgain = true;
					continue;
				}
				// Insert service urls into DB.service-urls
				await putServiceURLs(moreService, category);
			}
		} while (true);

		// Mark the crawled category document in DB
		await CategoryURL.findByIdAndUpdate(
			category.id,
			{ 'isCrawled': true },
			true,
			(err, doc) => {
				err
					? chalk.bgRedBright(chalk.black(`category.isCrawled couldn't be set to true: \n ${doc}`)) // Update failed
					: chalk.bgCyan(chalk.black(`${doc}`)) // Update succesfull
			}
		);
	}
}

function logFailedRequest(type, rest) {
	let failedReqest = new FailedRequest({
		timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
		proxyIP: `${PROXY.ip}:${PROXY.port}`,
		userAgent: `${userAgent}`,
		type: type,
		...rest
	});

	failedReqest.save(function (err, failedReqest) {
		if (err)
			return console.error(err);
		log(chalk.bgRed(failedReqest, ' — failed request info added'));
	});
}
