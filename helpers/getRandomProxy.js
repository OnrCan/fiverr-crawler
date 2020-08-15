const proxy = require('../config').proxy;

async function getRandomProxy(lastIndex = false) {
	let poolLength = proxy.ipPool.length,
		ipPool = [...proxy.ipPool],
		port = proxy.port,
		username = proxy.credentials.username,
		password = proxy.credentials.password;

	if (lastIndex) {
		ipPool.splice(lastIndex, 1);
		poolLength = ipPool.length;
	}
	console.log(`pool length: ${poolLength}`);

	let randomIndex = Math.floor(Math.random() * poolLength);
	console.log(randomIndex, ipPool[randomIndex]);
	return {
		"ip": ipPool[randomIndex],
		"port": port,
		"username": username,
		"password": password,
		"index": randomIndex
	}
}

module.exports = { getRandomProxy }