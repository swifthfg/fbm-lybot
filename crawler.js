const
	cheerio = require('cheerio')
	rp = require('request-promise')

function crawlWebrazzi() {
	let url = 'https://webrazzi.com/'
	let now = new Date()
	let year = now.getFullYear()
	let month = now.getMonth() + 1 // js returns 0 based index month
	let crawlUrl = url + year + '/' + month

	return rp(crawlUrl)
	.then(function(body) {
		let parsedRoot = cheerio.load(body)
		let contentUrls = parsedRoot('.post-title > a')
		let images = parsedRoot('.post-gallery > a > img')
		let subtitles = parsedRoot('.post-content > p')
		let results = []
		for (let i = 0; i < contentUrls.length; i++) {
			try {
				let tempContent = {
					contentTitle: contentUrls[i].attribs['title'],
					subTitle: subtitles[i].children[0].data,
					contentUrl: contentUrls[i].attribs['href'],
					imgUrl: images[i].attribs['data-src'],
				}
				results.push(tempContent)
			}
			catch(err) {
				console.error(err)
			}
		}
		return results
	})
	.catch(function (err) {
		console.error('Webrazzi parsing failed')
		console.error(err)
	})
}

function crawlDunyaHalleri() {
	let options = {
		url: 'https://www.dunyahalleri.com',
		method: 'GET',
		headers: {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' // without this 403 code is returned
		},
	}
	return rp(options)
	.then(function(body) {
		let parsedRoot = cheerio.load(body)
		let uptodateNewsUrls = parsedRoot('article > div > a')
		let images = parsedRoot('article > div > a > img')
		let subtitles = parsedRoot('article > .entry-content > p')
		let titles = parsedRoot('article > .entry-header > h2 > a')

		let titleOffset = 4
		let results = []
		for (let i = 0; i < uptodateNewsUrls.length; i++) {
			try {

				let tempContent = {
					contentUrl: uptodateNewsUrls[i].attribs['href'],
					contentTitle: titles[titleOffset + i].children[0].data,
					subTitle: subtitles[i].children[0].data,
					imgUrl: images[i].attribs['data-lazy-src']
				}
				results.push(tempContent)
			}
			catch (err) {
				console.error(err);
			}
		}
		console.log(results);
		return results
	})
	.catch(function (err) {
		console.error('DunyaHalleri parsing failed')
		console.error(err)
	})
}

module.exports = {
	crawlWebrazzi: crawlWebrazzi,
	crawlDunyaHalleri: crawlDunyaHalleri,
}
