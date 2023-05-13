import 'https://cdn.jsdelivr.net/gh/oskarrough/rough-spinner/rough-spinner.js'
import { html, render } from 'https://unpkg.com/lit-html?module'
import { getAccessToken, extractSpotifyPlaylistId, getSpotifyPlaylist, parseSpotifyTrack, searchYoutube } from './helpers.js'


// Get and set the Spotify access token
document.querySelector('#spotifyToYoutube').addEventListener('submit', handleSpotifyTokenSubmit)

export async function handleSpotifyTokenSubmit(event) {
	event.preventDefault()

  const $form = event.target
	const formData = new FormData($form)

	const $btn = $form.querySelector('button[type="submit"]')
	const $token = $form.querySelector('[name="token"]')
	$btn.disabled = true

  // Get the Spotify token
	let token = formData.get('token')
  if (!token) {
    try {
      const clientId = formData.get('clientId')
      const clientSecret = formData.get('clientSecret')
      token = await getAccessToken(clientId, clientSecret)
      $token.value = token
    } catch (error) {
      console.error('An error occurred:', error)
      $token.value = 'ERROR GETTING TOKEN!'
    }
  }

	try {
    // Query the playlist
	  const playlistId = extractSpotifyPlaylistId(formData.get('url'))
		const playlist = await getSpotifyPlaylist(playlistId, token)
		const tracks = playlist.map(item => parseSpotifyTrack(item.track)).slice(0,3)

    // Search YouTube and render as results come in
    const maxResults = 4 //formData.get('limit')
		for (const [i, t] of Object.entries(tracks)) {
			tracks[i].searchResults = await searchYoutube(t.artist, t.title, t.isrc, maxResults)
		  displayResults(tracks, i)
		}
    console.log('Spotify tracks with YouTube search results', tracks)
	} catch (error) {
		console.error('An error occurred:', error)
	} finally {
		$btn.disabled = false
	}
}

function displayResults(tracks, i) {
	render(tableTemplate(tracks, Number(i) + 1), document.querySelector('#app'))
}

const tableTemplate = (tracks, i) => html`
  ${i < tracks.length ? html`<rough-spinner spinner="1" fps="30"></rough-spinner> Matching ${i}/${tracks.length}...` : null}
  <form @submit=${saveResults}>
	  <ul class="tracks">
      ${tracks.map(
        (track, i) => html`<li>
          <strong>${i}. ${track.artist} - ${track.title}</strong>
          <a target="_blank" href=${track.url}>link</a>
          <ul class="results">
            ${track.searchResults.map((video) => searchResultTemplate(track, video))}
          </ul>
        </li>`
      )}
    </ul>
    <button type="submit">Save results</button><br>
    <br>
    <textarea></textarea>
  </form>
`

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

// Inserts a newline with the YouTube URL for every matched track
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

