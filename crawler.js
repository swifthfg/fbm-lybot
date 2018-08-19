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
	.then(function (body) {
		let parsedRoot = cheerio.load(body);
		let contentUrls = parsedRoot('.post-title > a')
		let images = parsedRoot('.post-gallery > a > img')
		let subtitles = parsedRoot('.post-content > p')
		let results = [];
		for (var i = 0; i < contentUrls.length; i++) {
			try {
				let tempContent = {
					contentTitle: contentUrls[i].attribs['title'],
					subTitle: subtitles[i].children[0].data
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
		console.error('Webrazzi parsing process failed: ' + err)
	})
}

crawlWebrazzi().then(function(res){
	console.log(res);
})

module.exports = {
	crawlWebrazzi: crawlWebrazzi,
}
