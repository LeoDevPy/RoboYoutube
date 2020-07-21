const algorithmia = require('algorithmia') //importando o modulo para dentro do c�digo 
const algorithmiaApiKey = require ('../robots/credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd') // biblioteca  para separar senten�as de um texto pontos por ex. 

async function robot(content){
	await fetchContentFromWikipedia(content)
	sanitizeContent(content)						
	breakContentIntoSentences(content)
	// toda fun��o assincrona retorna uma promessi. 
	
	async function fetchContentFromWikipedia(content){
		// PASSOS PARA UTILIZA��O DO ALGORITMO 
		// 1 AUTENTICA��O 
		// 2 DEFINE O ALGOTIMO 
		// 3 EXECUTA O ALGORITMO 
		// 4 RETORNA-SE O VALOR
	
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
}

module.exports = robot
