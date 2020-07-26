const algorithmia = require('algorithmia') //importando o modulo para dentro do c�digo 
const algorithmiaApiKey = require ('../robots/credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd') // biblioteca  para separar senten�as de um texto pontos por ex. 

const watsonApiKey = require('../robots/credentials/watson-nlu.json').apikey

const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
 
const nlu = new NaturalLanguageUnderstandingV1({
	  username:'lsouzadearau@dxc.com',
	  password:'Leo135798',//
	  iam_apikey_name: watsonApiKey,
	  version: '2018-04-05',
	  url: "https://gateway.watsonplatform.net/natural-language-understanding/api/" 
})

// const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
// const { IamAuthenticator } = require('ibm-watson/auth')

// const nlu = new NaturalLanguageUnderstandingV1({
//   authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
//   version: '2018-04-05',
//   url: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/1dee7bd2-ff3a-44db-b08f-a91a876c9d32'
// })

const state = require('./state.js')

async function robot() {
	const content = state.load()

	await fetchContentFromWikipedia(content)
	sanitizeContent(content)						
	breakContentIntoSentences(content)
	limitMaximumSentences(content)
	await fetchKeywordsOfAllSentences(content)

	state.save(content)
	// toda fun��o assincrona retorna uma promessi. 
			// PASSOS PARA UTILIZA��O DO ALGORITMO 
		// 1 AUTENTICA��O 
		// 2 DEFINE O ALGOTIMO 
		// 3 EXECUTA O ALGORITMO 
		// 4 RETORNA-SE O VALOR
	
	async function fetchContentFromWikipedia(content){
		const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey) // declarou um API KEY TEMPORARIA retorna uma instancia autenticada do algorithmia. Atraves dessa instancia chegaremos ao algoritmo. 
		const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')// metodo algo para acesso atr�ves do link utilizado acima. Retorna uam instancia do metodo que � utilizado abaixo. 
		const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm) // usa-se o metodo pipi que aceita por parametro um conteudo que a gente quer buscar no Wikipedia. Passando o objeto searchTerm que ser� utilizado pelo algoritmo para passar o valor no buscador do wikipedia. A variavel que recebera ser� utilizada abaixo que tem como o metodo o get. 
		const wikipediaContent = wikipediaResponde.get() // ao executar o metodo o conteudo do wikipedia cai dentro da vari�vel 
		
		content.sourceContentOriginal = wikipediaContent.content // source para pegar somente o conte�do dentro do content do wikipedia.
	}
	
	// fazer a limpeza das linhas em branco 
	function sanitizeContent(content){
		const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
		const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

		content.sourceContentSanitized = withoutDatesInParentheses 

		function removeBlankLinesAndMarkdown (text) {
			const allLines = text.split('\n')

			// utiliza-se o filtro para limpar as linhas se linhar estiver em branco retorna true senao false 
			const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
				if (line.trim().length === 0 || line.trim().startsWith('=')) {
					return false 
				}
				return true
			})

			return withoutBlankLinesAndMarkdown.join(' ') // junta o texto e coloca um espa�o na jun��o. metodo join. 
		}
	}

	function removeDatesInParentheses(text){
		return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
	}
	
	function breakContentIntoSentences(content) {
		content.sentences = []

		const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
		sentences.forEach((sentence) => {
			content.sentences.push({
				text: sentence,
				keywords: [],
				images: [] 
			})
		})
	}

	function limitMaximumSentences(content){
		content.sentences = content.sentences.slice(0, content.maximumSentences)
	}

	async function fetchKeywordsOfAllSentences(content){
		for (const sentence of content.sentences) {
			sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
		}
    }
	async function fetchWatsonAndReturnKeywords(sentence){
	      return new Promise((resolve, reject) =>{
	        nlu.analyze({
	             text:sentence,
	             features:{
	             keywords: {}
	             }
	        }, (error, response) => {
	        if(error) {
	             throw error
	        }
                const keywords = response.keywords.map((keyword) => {
                     return keyword.text
                })
                resolve(keywords)
	     })
	})
     }
		
}

module.exports = robot
