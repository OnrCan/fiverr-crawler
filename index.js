const puppeteer = require('puppeteer-extra');
const getRandomProxy = require('./helpers/getRandomProxy').getRandomProxy;
const getRandomUserAgent = require('./helpers/getRandomUserAgent').getRandomUserAgent;

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

(async () => {
	let page,
		browser,
		proxy,
		lastProxyIndex = false;

	let categoryURLList = [
		"https://www.fiverr.com/categories/graphics-design/creative-logo-design",
		"https://www.fiverr.com/categories/graphics-design/brand-style-guides"
	],
		categoryURL

	for (let i = 0; i < categoryURLList.length; i++) {
		categoryURL = categoryURLList[i];

		proxy = lastProxyIndex
			? await getRandomProxy(lastProxyIndex)
			: await getRandomProxy();
		lastProxyIndex = proxy.index;

		browser = await puppeteer.launch({
			headless: false,
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

		await page.close();
		await browser.close();

		if (serviceURLList.length) { // no service url

			for (let k = 0; k < serviceURLList.length; k++) {
				let serviceURL = serviceURLList[k];

				proxy = lastProxyIndex
					? await getRandomProxy(lastProxyIndex)
					: await getRandomProxy();
				lastProxyIndex = proxy.index;

				browser = await puppeteer.launch({
					headless: false,
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
					return `${category} — ${title} — ${ordersInQueue} in queue`;
				});
				console.log(serviceInfo);

				await page.waitFor(15000) // 15 seconds
				await page.close();
				await browser.close();
			}
		} else {
			continue; // No more services, go to the next category
		}
	}
})();