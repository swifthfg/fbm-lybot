const
	constants = require('./constants')
	request = require('request')
	rp = require('request-promise')
	express = require('express')
	body_parser = require('body-parser')
	app = express().use(body_parser.json())
	crawler = require('./crawler')
	require('dotenv').config()


app.listen(process.env.PORT || 1337, () => console.log('LyBot webhook is up'))

app.get('/', function (req, res) {
	res.send('Welcome to LYBOT')
})

var senderIds = []
var webrazziNewsMD = null
var dunyaHalleriMD = null

crawler.crawlWebrazzi().then(function (results) {
	webrazziNewsMD = formatMessageDataFromCrawlingResults(results)
})

crawler.crawlDunyaHalleri().then(function (results) {
	dunyaHalleriMD = formatMessageDataFromCrawlingResults(results)
})

setInterval(function() {
	crawler.crawlWebrazzi().then(function (results) {
		webrazziNewsMD = formatMessageDataFromCrawlingResults(results)
		for (let i = 0; i < senderIds.length; i++) {
			try {
				sendText(senderIds[i], 'Here are your Webrazzi News, enjoy!')
				sendPostbackMessage(senderIds[i], webrazziNewsMD)
			} catch (e) {
				console.error('Error occured while sending Webrazzi interval messages');
				console.error(e);
			}
		}
	 })
}, 1000*27*60)

setInterval(function() {
	crawler.dunyaHalleriMD().then(function (results) {
		dunyaHalleriMD = formatMessageDataFromCrawlingResults(results)
		for (let i = 0; i < senderIds.length; i++) {
			try {
				sendText(senderIds[i], 'Here are your DünyaHalleri News, enjoy!')
				sendPostbackMessage(senderIds[i], dunyaHalleriMD)
			} catch (e) {
				console.error('Error occured while sending DunyaHalleri interval messages');
				console.error(e);
			}
		}
	 })
}, 1000*25*60)

setInterval(function() {
	console.log("Ping");
}, 1000*5*60)

// Receives message and responds with proper text or postback options
app.post('/webhook', (req, res) => {
	let body = req.body

	if (body.object !== 'page') {
		res.sendStatus(404)
		return
	}

	let messagingEvents = req.body.entry[0].messaging
	if (!messagingEvents) {
		console.log('No event')
		res.sendStatus(422)
		return
	}
	for (let i = 0; i < messagingEvents.length; i++) {
		let mEvent = messagingEvents[i]
		let sender = mEvent.sender.id
		if (!(senderIds.indexOf(sender) > -1)) {
			senderIds.push(sender)
		}
		getSenderName(sender).then(function(response) {
			if (isNaN(sender)) {
				console.log('NaN sender: ' + sender);
				res.send(404)
				return
			} else {
				let firstName = response.name.substr(0, response.name.indexOf(' '))
				if (mEvent.message && mEvent.message.text) {
					let text = mEvent.message.text.toLowerCase()
					if (doesItExistInArray(constants.hiWordsEN_customer, text.split())) {
						sendGreetingQuickReply(sender, firstName)
					} else if (doesItExistInArray(constants.farewellWordsEN_customer, text.split())) {
						sendText(sender, 'Good Bye ' + firstName + '. You are always welcome. Please make sure that you come here and chat again. See you :)')
					} else if (text == 'webrazzi'){
						sendPostbackMessage(sender, webrazziNewsMD)
					} else if (text == 'dünya halleri'){
						sendPostbackMessage(sender, dunyaHalleriMD)
					} else {
						sendText(sender, 'I didn\'t get what you said')
						sendPostbackMessage(sender, null)
					}
				}
				else if (mEvent.postback) {
					if (mEvent.postback.payload == 'getstarted') {
						sendPostbackMessage(sender, null)
					} else if (mEvent.postback.payload == 'identityinfo') {
						sendText(sender, "I am a notifier bot that can serve you for your news reading pleasure. I crawl the websites you wish and send the latest news every hour. Enjoy your news.")
					} else if (mEvent.postback.payload == 'getmethenews') {
						sendGreetingQuickReply(sender, firstName)
					}
				}
			}
		})
		.then(function() {
			res.sendStatus(200)
		})
		.catch(function(error) {
			sendTypeOffAction(sender)
			console.error('error occured while fetching user name')
			console.error(error)
			res.sendStatus(422)
		})
	}
})

app.get('/webhook', (req, res) => {
	const VERIFY_TOKEN = process.env.TOKEN

	let mode = req.query['hub.mode']
	let token = req.query['hub.verify_token']
	let challenge = req.query['hub.challenge']

	if (mode && token) {
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
			console.log('WEBHOOK_VERIFIED')
			res.status(200).send(challenge)
		} else {
			res.sendStatus(403)
		}
	}
})


/* ############################################################ UTILS ############################################################ */


function sendTypeOnAction(sender) {
	request({
		url: constants.graphMessagesURL,
		qs: {access_token: process.env.TOKEN},
		method: 'POST',
		json: {
			recipient: {id: sender},
			sender_action: 'typing_on'
		}
	}, function(error, response, body) {
		genericErrorHandler(error, response)
	})
}

function sendTypeOffAction(sender) {
	request({
		url: constants.graphMessagesURL,
		qs: {access_token: process.env.TOKEN},
		method: 'POST',
		json: {
			recipient: {id: sender},
			sender_action: 'typing_off'
		}
	}, function(error, response, body) {
		genericErrorHandler(error, response)
	})
}

function genericErrorHandler(error, response) {
	if (error) {
		console.error('error occured')
		console.error(error);
	} else if (response.body.error) {
		console.error('response body error occured')
		console.error(response.body.error);
	}
}

function formatMessageDataFromCrawlingResults(crawlingResults) {
	let payloadElements = []
	let cardLimit = crawlingResults.length < 5 ? crawlingResults.length : 5;
	for (let i = 0; i < cardLimit; i++) {
		let tempElement = {
			'title': crawlingResults[i].contentTitle,
			'subtitle': crawlingResults[i].subTitle,
			'image_url': crawlingResults[i].imgUrl,
			'default_action': {
				'type': 'web_url',
				'url': crawlingResults[i].contentUrl,
				'webview_height_ratio': 'tall',
			},
			"buttons":[
				{
					'type':'web_url',
					'url':crawlingResults[i].contentUrl,
					'title':'View News'
				}
			]
		}
		payloadElements.push(tempElement)
	}

	return {
		'attachment': {
			'type': 'template',
			'payload': {
				'template_type': 'generic',
				'elements': payloadElements
			}
		}
	}
}

function sendPostbackMessage(sender, messageData=null) {
	if (messageData) {
		sendMessage(sender, messageData)
	} else {
		var genericMessageData = {
			'attachment': {
				'type': 'template',
				'payload': {
					'template_type': 'generic',
					'elements': [{
						'title': 'How can I help you?',
						'subtitle': 'Take a look at the services you can ask.',
						'image_url': 'https://pbs.twimg.com/profile_images/830523441660968960/YozH1XXi_400x400.jpg',
						'buttons': [{
							'type': 'postback',
							'title': 'Who am I?',
							'payload': 'identityinfo',
						}, {
							'type': 'postback',
							'title': 'Get Me The News',
							'payload': 'getmethenews',
						}]
					}]
				}
			}
		}
		sendMessage(sender, genericMessageData)
	}
}

function sendText(sender, textMessage) {
	let messageData = {text: textMessage}
	sendMessage(sender, messageData)
}

function sendMessage(sender, messageData) {
	sendTypeOnAction(sender)
	setTimeout(function() {
		rp({
			url: constants.graphMessagesURL,
			qs: {access_token: process.env.TOKEN},
			method: 'POST',
			json: {
				recipient: {id: sender},
				message: messageData
			}
		})
		.catch(function(error) {
			sendTypeOffAction(sender)
			console.error('error occured while sending Message')
			console.error(error)
		})
	}, 900)
}

function getGreetingQuickReply(firstName=null) {
	let greetingQRMessageData = {
		'text': firstName ? 'Hi ' + firstName + '. Which website news do you want?' : 'Which news do you want to hear about?',
		'quick_replies': [
			{
				'content_type': 'text',
				'title': 'Webrazzi',
				'payload': 'webrazzi',
			},
			{
				'content_type': 'text',
				'title': 'Dünya Halleri',
				'payload': 'dunya_halleri',
			}
		]
	}
	return greetingQRMessageData;
}

function sendGreetingQuickReply(sender, firstName) {
	sendMessage(sender, getGreetingQuickReply(firstName));
}

function doesItExistInArray(haystack, arr) {
	return arr.some(function (v) {
		return haystack.indexOf(v) >= 0
	})
}

function getSenderName(senderId) {
	let options = {
		url: constants.graphURL + senderId,
		qs: {fields: 'name,birthday', access_token: process.env.TOKEN},
		method: "GET",
		json: true
	}
	return rp(options)
}
