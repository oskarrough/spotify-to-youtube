import 'https://cdn.jsdelivr.net/gh/oskarrough/rough-spinner/rough-spinner.js'
import { html, render } from 'https://unpkg.com/lit-html?module'
import { getAccessToken, extractSpotifyPlaylistId, getSpotifyPlaylist, parseSpotifyTrack, searchYoutube } from './helpers.js'

// Get and set the Spotify access token
document.querySelector('#spotifyTokenForm').addEventListener('submit', handleSpotifyTokenSubmit)
export async function handleSpotifyTokenSubmit(event) {
	event.preventDefault()
	const formData = new FormData(event.target)
	const clientId = formData.get('clientId')
	const clientSecret = formData.get('clientSecret')
  const $tokenInput = document.querySelector('[name="token"]')
	try {
		const token = await getAccessToken(clientId, clientSecret)
		// Add it to the next form.
		$tokenInput.value = token
	} catch (error) {
		console.error('An error occurred:', error)
		$tokenInput.value = 'ERROR GETTING TOKEN!'
	}
}

// Query the playlist, search the tube for tracks and display results
document.querySelector('#playlistForm').addEventListener('submit', handleSubmit)
async function handleSubmit(event) {
	event.preventDefault()

	const submitBtn = event.target.querySelector('button[type="submit"]')
	submitBtn.disabled = true

	const formData = new FormData(event.target)
	const playlistId = extractSpotifyPlaylistId(formData.get('url'))
  const limit = 4 //formData.get('limit')

	try {
		const playlist = await getSpotifyPlaylist(playlistId, formData.get('token'))
		const tracks = playlist.map(parseSpotifyTrack)
		for (const [i, t] of Object.entries(tracks)) {
			tracks[i].searchResults = await searchYoutube(t.artist, t.title, t.isrc, limit)
		  displayResults(tracks, i)
		}
		console.log('spotify tracks with youtube search results', tracks)
		displayResults(tracks)
	} catch (error) {
		console.error('An error occurred:', error)
	} finally {
		submitBtn.disabled = false
    event.target.querySelector('[name="debug"]').textContent = ''
	}
}

function displayResults(tracks, i) {
  // render(, event.target.querySelector('[name="debug"]'))
	render(tableTemplate(tracks, i), document.querySelector('#app'))
}

const searchResultTemplate = (track, video) => html`
	<li>
		<label>
      <input type="radio" name=${'result_' + track.id} value=${video.id}>
      <img src=${video.thumbnail} alt=${video.title} />
    </label>
		<ul>
		  <li><a href=${`https://www.youtube.com/watch?v=` + video.id} target="_blank">${video.title}</a></li>
			${video.description ? html`<li>${video.description}</li>` : ''}
			<li><small>
      ${video.channelTitle ? html`${video.channelTitle}, ` : ''}
      ${video.views}${video.publishedAt ? html`, ${video.publishedAt}` : ''}</small></li>
		</ul>
	</li>
`

function saveResults(event) {
  event.preventDefault()
  const fd = new FormData(event.target)
  const youtubeIds = []
  for (const [_key, ytid] of fd.entries()) {
    youtubeIds.push(ytid)
  }
  const $output = event.target.querySelector('textarea')
  $output.value = youtubeIds.map(id => `https://www.youtube.com/watch?v=${id}`).join('\r\n')
}

const tableTemplate = (tracks, i) => html`
  ${i ? html`<rough-spinner spinner="1" fps="30"></rough-spinner> Matching ${Number(i) + 1}/${tracks.length}...` : null}
  <form @submit=${saveResults}>
	  <ul class="tracks">
      ${tracks.map(
        (track, i) => html`<li>
          <strong>${Number(i) + 1}. ${track.artist} - ${track.title}</strong>
          <ul class="results">
            ${track.searchResults.map((video) => searchResultTemplate(track, video))}
          </ul>
        </li>`
      )}
    </ul>
    <button type="submit">Save results</button><br>
    <textarea></textarea>
  </form>
`
