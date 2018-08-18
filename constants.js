function define(name, value) {
	Object.defineProperty(exports, name, {
		value:      value,
		enumerable: true
	})
}

define('hiWordsTR_customer', [
	'merhaba',
	'merhabalar',
	'meraba',
	'merabalar',
	'selam',
	'selamlar',
	'günaydın'
])

define('farewellWordsTR_customer', [
	'görüşürüz',
	'görüşmek üzre',
	'görüşmek üzere',
	'iyi geceler',
	'iyi akşamlar'
])

define('thankWordsTR_customer', [
	'teşekkürler',
	'teşekkür ederim',
	'sağolun',
	'sağol',
	'teşekkür',
	'yardımcı oldu'
])

define('hiWordsTR_bot', [
	'Merhaba',
])

define('hiWordsEN_customer', [
	'Hi',
	'Hello',
	'Halo',
	'Hola',
	'Good morning',
])

define('farewellWordsEN_customer', [
	'good bye',
	'bb',
	'bye',
	'see u',
	'see you',
	'c u',
	'cu',
	'c you',
	'bye bye'
])

define('thankWordsEN_customer', [
	'thank you',
	'thanks',
	'it helped',
	'this helped',
	'you helped',
	'helped'
])

define('hiWordsEN_bot', [
	'Hi',
	'Hello'
])

define('graphURL', 'https://graph.facebook.com/v2.11/')
