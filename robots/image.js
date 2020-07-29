const google = require('googleapis').google;
const customSearch = google.customsearch('v1')
const state = require ('./state.js')

const googleSearchCredentials = require('../robots/credentials/google-search.json')

async function robot() {
    const content = state.load()

    await fetchImagesOfAllSentences(content)
    await downloadAllImages(content)
    state.save(content)

    async function fetchImagesOfAllSentences(content){
        for(const sentence of content.sentences){
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await fetchGoogleAndReturnImagesLinks(query)

            sentence.googleSearchQuery = query
        }
    }

    async function fetchGoogleAndReturnImagesLinks(query) {
        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searEngineId,
            q: query,
            searchType: 'image',
            imgSize:  'huge',
            num: 2
        })

        const imgesUrl = response.data.items.map((item) => {
            return item.link
        })

        return imagesUrl 
    } 

    async function downloadAllImages(content){
        content.downloadedImages = []

        content.sentences[1].images[0] = 'url imagem'

        for(let sentenceIndex =0; sentenceIndex < content.sentences.length; sentenceIndex++){
            const images = content.sentences[sentencesIndex].images

            for(let imageIndex = 0; imagesIndex < imagens.length; imagesIndex++){
                const imagesUrl = images[imagesIndex]

                try{
                    if (content.downloadedImages.includes(imageUrl)){
                        throw new Error('Imagem já foi baixada ')
                    }

                    await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)

                    content.downloadedImages.push(imageUrl)
                    console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imagensUrl}`)
                    break
                }catch(error){
                    console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar (${imagesUrl}): $(error)`)
                }
            }
        }
    }

    async function downloadAndSave(url, fileName) {
        return imageDownloader.image({
            url, url, 
            dest: `..robots/content/${fileName}`
        })
    }

}

module.exports = robot 