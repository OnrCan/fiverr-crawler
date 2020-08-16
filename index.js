const puppeteer = require('puppeteer-extra');
const getRandomProxy = require('./helpers/getRandomProxy').getRandomProxy;
const getRandomUserAgent = require('./helpers/getRandomUserAgent').getRandomUserAgent;

const moment = require('moment');

require('./database');
const {
	ServiceURL,
	CategoryURL,
	ServiceInfo,
	FailedRequest
} = require('./database/Schemas');

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

(async () => {

	let page,
		browser,
		proxy,
		lastProxyIndex = false,
		userAgent,
		tryAgain = false;
	
	var serviceURL,
		serviceURLList = [];

	let categoryURLList = await CategoryURL.find({}, (err, urlList) => {
		if (err) return console.error(err);
		return urlList;
	})

	let categoryURL, pageNumber = 0, moreService;

	for (let i = 0; i < categoryURLList.length; i++) {
		do {
			if (!tryAgain) {
				pageNumber++;
				categoryURL = `${categoryURLList[i].url}?page=${pageNumber}`;
				console.log(`Scraping: ${categoryURL}`);
			}
			proxy = lastProxyIndex
				? await getRandomProxy(lastProxyIndex)
				: await getRandomProxy();
			lastProxyIndex = proxy.index;

			browser = await puppeteer.launch({
				headless: true,
				args: [`--proxy-server=${proxy.ip}:${proxy.port}`]
			});
			page = await browser.newPage();
			await page.authenticate({
				username: proxy.username,
				password: proxy.password
			});

			userAgent = await getRandomUserAgent();
			await page.setUserAgent(`${userAgent}`);

			try {
				await page.goto(`${categoryURL}`, { waitUntil: 'load', timeout: 0 });
				tryAgain = false;
			} catch (error) {
				let failedRequestItemCategory = new FailedRequest({
					timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
					type: 'category',
					categoryURL: categoryURL,
					proxyIP: `${proxy.ip}:${proxy.port}`,
					userAgent: `${userAgent}`,
					reason: `timeout`
				});

				failedRequestItemCategory.save(function (err, failedRequestItemCategory) {
					if (err) return console.error(err);
					console.log(failedRequestItemCategory, ' — failed request info added (timeout)');
				});

				await page.close();
				await browser.close();

				tryAgain = true;
				continue; // No more services, or banned ip then go to the next category
			}

			moreService = await page.evaluate(() => {
				let elements = document.querySelectorAll('a.media');
				if (typeof elements !== "undefined" && elements.length !== 0) {
					return [...elements].map(item => item.getAttribute('href'));
				} else {
					if (document.querySelector('h1').innerText == "One Small Step" || document.querySelector('h1').innerText == "Access Denied") { // Banned
						return 'banned';
					}
					return false;
				}
			});

			if (!moreService) {
				await page.close();
				await browser.close();

				break;
			}
			else {
				if (moreService == 'banned') {
					await page.close();
					await browser.close();
					
					tryAgain = true;
					continue;
				}
				moreService.forEach(service => (serviceURLList.push(service)));
			}

			await page.close();
			await browser.close();

		} while (true);

		if (serviceURLList.length) {
			serviceURLList.forEach(url => {
				let serviceURLItem = new ServiceURL({
					timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
					categoryURL: `${categoryURL}`,
					url: `${url}`
				});
				serviceURLItem.save(function (err, serviceURLItem) {
					if (err) return console.error(err);
					console.log(url, ' — service url added');
				});
			});

			for (let k = 0; k < serviceURLList.length; k++) {
				if (!tryAgain) {
					serviceURL = serviceURLList[k];
				}

				proxy = lastProxyIndex
					? await getRandomProxy(lastProxyIndex)
					: await getRandomProxy();
				lastProxyIndex = proxy.index;

				browser = await puppeteer.launch({
					headless: true,
					args: [
						`--proxy-server=${proxy.ip}:${proxy.port}`
					]
				});
				page = await browser.newPage();
				await page.authenticate({
					username: proxy.username,
					password: proxy.password
				});

				userAgent = await getRandomUserAgent();
				await page.setUserAgent(`${userAgent}`);
				try {
					await page.goto(`https://www.fiverr.com${serviceURL}`, { waitUntil: 'load', timeout: 0 });	

					let serviceInfo = await page.evaluate(() => {
						let category = [...document.querySelectorAll('.breadcrumbs a')]
							.map(el => el.innerText);
						let title = document.querySelector('h1').innerText;
						let ordersInQueue = document.querySelector('.orders-in-queue')
							? document.querySelector('.orders-in-queue').innerText.split(' ')[0]
							: "0";
	
						return {
							category: category[0],
							subCategory: category[1],
							title: title,
							ordersInQueue: ordersInQueue
						}
					});

					if (serviceInfo.title == "One Small Step" || serviceInfo.title == "Access Denied") { // Banned
						let failedRequestItem = new FailedRequest({
							timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
							type: 'service',
							categoryURL: categoryURL,
							url: `https://www.fiverr.com${serviceURL}`,
							proxyIP: `${proxy.ip}:${proxy.port}`,
							userAgent: `${userAgent}`,
							reason: `banned`
						});
	
						failedRequestItem.save(function (err, failedRequestItem) {
							if (err) return console.error(err);
							console.log(failedRequestItem, ' — failed request info added (banned)');
						});

						tryAgain = true;
						await page.close();
						await browser.close();

					} else {
						tryAgain = false;
						let serviceInfoItem = new ServiceInfo({
							timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
							category: serviceInfo.category,
							subCategory: serviceInfo.subCategory,
							title: serviceInfo.title,
							ordersInQueue: serviceInfo.ordersInQueue,
							url: `https://www.fiverr.com${serviceURL}`
						});
						
						serviceInfoItem.save(function (err, serviceInfoItem) {
							if (err) return console.error(err);
							console.log(serviceInfoItem, ' — service info added');
						});
					}

					await page.waitFor(process.env.WAIT_PAGE_DELAY || 8000)
					await page.close();
					await browser.close();

				} catch (error) {
					let failedRequestTimeoutService = new FailedRequest({
						timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
						type: 'service',
						categoryURL: categoryURL,
						url: `https://www.fiverr.com${serviceURL}`,
						proxyIP: `${proxy.ip}:${proxy.port}`,
						userAgent: `${userAgent}`,
						reason: `timeout`
					});

					failedRequestTimeoutService.save(function (err, failedRequestTimeoutService) {
						if (err) return console.error(err);
						console.log(failedRequestTimeoutService, ' — failed request info added (timeout)');
					});

					await page.close();
					await browser.close();
					tryAgain = true;
				}
			}
		} else {
			let failedRequestItem = new FailedRequest({
				timeStamp: moment().format("DD-MM-YYYY hh:mm a"),
				type: 'category',
				categoryURL: categoryURL,
				proxyIP: `${proxy.ip}:${proxy.port}`,
				userAgent: `${userAgent}`,
				reason: `No more services, or banned ip`
			});

			failedRequestItem.save(function (err, failedRequestItem) {
				if (err) return console.error(err);
				console.log(failedRequestItem, ' — failed request info added (No more services, or banned ip)');
			});
			continue; // No more services, or banned ip then go to the next category
		}
	}

	await page.close();
	await browser.close();
})();