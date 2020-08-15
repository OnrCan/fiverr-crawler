const puppeteer = require('puppeteer-extra');
const getRandomProxy = require('./helpers/getRandomProxy').getRandomProxy;
const getRandomUserAgent = require('./helpers/getRandomUserAgent').getRandomUserAgent;

require('./database');
const {
	ServiceURL,
	CategoryURL,
	ServiceInfo
} = require('./database/Schemas');

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

(async () => {

	let page,
		browser,
		proxy,
		lastProxyIndex = false;

	let categoryURLList = await CategoryURL.find({}, (err, urlList) => {
		if (err) return console.error(err);
		return urlList;
	})

	let categoryURL;

	for (let i = 0; i < categoryURLList.length; i++) {
		categoryURL = categoryURLList[i].url;
		console.log(`Scraping: ${categoryURLList}`);

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

		await page.setUserAgent(`${await getRandomUserAgent()}`);
		await page.goto(`${categoryURL}`);

		let serviceURLList = await page.evaluate(() => {
			let elements = document.querySelectorAll('a.media');
			if (typeof elements !== "undefined" && elements.length !== 0) {
				return [...elements].map(item => item.getAttribute('href'));
			} else {
				return [];
			}
		});

		serviceURLList.forEach(url => {
			let serviceURLItem = new ServiceURL({
				categoryURL: `${categoryURL}`,
				url: `${url}`
			});
			serviceURLItem.save(function (err, serviceURLItem) {
				if (err) return console.error(err);
				console.log(url, ' — service url added');
			});
		})

		await page.close();
		await browser.close();

		if (serviceURLList.length) {

			for (let k = 0; k < serviceURLList.length; k++) {
				let serviceURL = serviceURLList[k];

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

				await page.setUserAgent(`${await getRandomUserAgent()}`);
				await page.goto(`https://www.fiverr.com${serviceURL}`);

				let serviceInfo = await page.evaluate(() => {
					let category = [...document.querySelectorAll('.breadcrumbs a')]
						.map(el => el.innerText)
						.reduce((acc, prev) => `${acc}/${prev}`);
					let title = document.querySelector('h1').innerText;
					let ordersInQueue = document.querySelector('.orders-in-queue')
						? document.querySelector('.orders-in-queue').innerText.split(' ')[0]
						: "0";
					
					return {
						category: category,
						title: title,
						ordersInQueue: ordersInQueue
					}
				});
				
				let serviceInfoItem = new ServiceInfo({
					category: serviceInfo.category,
					title: serviceInfo.title,
					ordersInQueue: serviceInfo.ordersInQueue
				});
			
				serviceInfoItem.save(function (err, serviceInfoItem) {
					if (err) return console.error(err);
					console.log(url, ' — service info added');
				});

				await page.waitFor(15000) // 15 seconds
				await page.close();
				await browser.close();
			}
		} else {
			continue; // No more services, go to the next category
		}
	}
})();