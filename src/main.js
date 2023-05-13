import { html, render } from 'https://unpkg.com/lit-html?module'
import { getAccessToken, extractSpotifyPlaylistId, getSpotifyPlaylist, parseSpotifyTrack } from './spotify.js'

document.querySelector('#spotifyTokenForm').addEventListener('submit', handleSpotifyTokenSubmit)

export async function handleSpotifyTokenSubmit(event) {
	event.preventDefault()

	const formData = new FormData(event.target)
	const clientId = formData.get('clientId')
	const clientSecret = formData.get('clientSecret')

	try {
		const token = await getAccessToken(clientId, clientSecret)
		// Add it to the next form.
		document.querySelector('[name="token"]').value = token
	} catch (error) {
		console.error('An error occurred:', error)
	}
}

document.querySelector('#playlistForm').addEventListener('submit', handleSubmit)

async function handleSubmit(event) {
	event.preventDefault()

	const submitBtn = event.target.querySelector('button[type="submit"]')
	submitBtn.disabled = true

	const formData = new FormData(event.target)
	const playlistId = extractSpotifyPlaylistId(formData.get('url'))
	try {
		const playlist = await getSpotifyPlaylist(playlistId, formData.get('token'))
		const tracks = playlist.map(parseSpotifyTrack).slice(0, 3)
		for (const [i, t] of Object.entries(tracks)) {
			tracks[i].searchResults = await searchYouTube(t.artist, t.title, t.isrc)
		}
		console.log('spotify tracks with youtube search results', tracks)
		displayResults(tracks)
	} catch (error) {
		console.error('An error occurred:', error)
	} finally {
		submitBtn.disabled = false
	}
}

async function searchYouTube(artist, title, isrcCode) {
	let query = `${artist} ${title}`
	if (isrcCode) query += ` ISRC:${isrcCode}`
	const endpoint = 'https://ytsearch.deno.dev'
	const response = await fetch(`${endpoint}/?query=${encodeURIComponent(query)}`)
	const results = await response.json()
	return results.slice(0,5)
}

function displayResults(tracks) {
	render(tableTemplate(tracks), document.querySelector('#app'))
}

const searchResultTemplate = (x) => html`
	<li>
		<img src=${x.thumbnail} alt=${x.title} />
		<a href=${x.url} target="_blank">${x.title}</a>
		<ul>
			${x.description ? html`<li>${x.description}</li>` : ''} ${x.channelTitle ? html`<li>${x.channelTitle}</li>` : ''}
			${x.publishedAt ? html`<li>${x.publishedAt}</li>` : ''}
			<li>${x.views}</li>
		</ul>
	</li>
`

const tableTemplate = (tracks) => html`
	<ul>
		${tracks.map(
			(track) => html`<li>
				<strong>${track.title}</strong>
				<ul>
					${track.searchResults.map((item) => searchResultTemplate(item))}
				</ul>
			</li>`
		)}
	</ul>
`
