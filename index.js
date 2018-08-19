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

// Receives message and responds with proper text or postback options
app.post('/webhook', (req, res) => {
	let body = req.body

	if (body.object === 'page') {
		let messagingEvents = req.body.entry[0].messaging
		for (let i = 0; i < messagingEvents.length; i++) {
			let mEvent = messagingEvents[i]
			let sender = mEvent.sender.id
			getSenderName(sender).then(function(response) {
				if (mEvent.message && mEvent.message.text) {
					let text = mEvent.message.text
					let firstName = response.name.substr(0, response.name.indexOf(' '))
					if (doesItExistInArray(constants.hiWordsEN_customer, text.split())) {
						sendGreetingQuickReply(sender, firstName);
					} else if (text == 'Webrazzi'){
						crawler.crawlWebrazzi().then(function (results) {
							sendPostbackMessage(sender, formatMessageDataFromCrawlingResults(results))
						})
					} else {
						sendText(sender, 'What\'s up?')
						sendPostbackMessage(sender, null)
					}
				}
				else if (mEvent.postback) {
					sendText(sender, 'You have postbacked!')
				}
			})
			.catch(function(error) {
				console.log('error occured while fetching user name')
				console.error(error)
				res.sendStatus(422)
			})
		}
		res.sendStatus(200)
	} else {
		res.sendStatus(404)
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
					'title':'View Website'
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
						'title': 'Nasıl yardımcı olabilirim?',
						'subtitle': 'Size sağlayabileceğim hizmetlere göz atın.',
						'image_url': 'https://pbs.twimg.com/profile_images/830523441660968960/YozH1XXi_400x400.jpg',
						'buttons': [{
							'type': 'postback',
							'title': 'Who am I?',
							'payload': 'identityinfo',
						}, {
							'type': 'postback',
							'title': 'Amuse me',
							'payload': 'amusement',
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
	let recipientData = {id: sender}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token: process.env.TOKEN},
		method: 'POST',
		json: {
			recipient: recipientData,
			message: messageData
		}
	}, function(error, response, body) {
		if (error) {
			console.error('error occured')
			console.error(error);
		} else if (response.body.error) {
			console.error('response body error occured')
			console.error(response.body.error);
		}
	})
}

function getGreetingQuickReply(firstName=null) {
	let greetingQRMessageData = {
		'text': firstName ? 'Welcome to LyBot ' + firstName + '. Which website news do you want?' : 'Welcome to LyBot. Which news do you want to hear about?',
		'quick_replies': [
			{
				'content_type': 'text',
				'title': 'Webrazzi',
				'payload': 'webrazzi',
				// TODO logos will be added as image_url property
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
	var options = {
		url: constants.graphURL + senderId,
		qs: {fields: 'name,birthday', access_token: process.env.TOKEN},
		method: "GET",
		json: true
	}
	return rp(options)
}
