import { LitElement, html } from 'https://unpkg.com/lit?module'
import {
	getAccessToken,
	extractSpotifyPlaylistId,
	getSpotifyPlaylist,
	parseSpotifyTrack,
	searchYoutube,
} from './helpers.js'

export default class SpotifyToYoutube extends LitElement {
	static get properties() {
		return {
			tracks: { type: Array, state: true },
			matches: { type: Array, state: true },
			loading: { type: Boolean, state: true },
		}
	}

	maxTracks = 5000
	maxSearchResults = 3

	// Updates this.tracks
	async findMatches(event) {
		event.preventDefault()
		this.isLoading = true
		const $form = event.target
		const formData = new FormData($form)

		// Get the Spotify token
		let token = formData.get('token')
		if (!token) {
			const $token = $form.querySelector('[name="token"]')
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

		// Query the playlist
		try {
			const playlistId = extractSpotifyPlaylistId(formData.get('url'))
			const playlist = await getSpotifyPlaylist(playlistId, token)
			this.tracks = playlist.map((item) => parseSpotifyTrack(item.track)).slice(0, this.maxTracks)

			// Search YouTube and render as results come in
			for (const [i, t] of Object.entries(this.tracks)) {
				this.tracks[i].searchResults = await searchYoutube(t.artist, t.title, t.isrc, this.maxSearchResults)
				this.requestUpdate()
			}
			console.log('Spotify tracks with YouTube search results', this.tracks)
		} catch (error) {
			console.error('An error occurred:', error)
		} finally {
			this.loading = false
		}
	}

	// Inserts a newline with the YouTube URL for every matched track
	saveMatchingVideos(event) {
		event.preventDefault()
		const fd = new FormData(event.target)

		const matches = []
		for (const [spotifyId, youtubeId] of fd.entries()) {
			const spotifyTrack = this.tracks.find((t) => t.id === spotifyId)
			const title = spotifyTrack.artist + ' - ' + spotifyTrack.title
			const track = { spotifyId, youtubeId, title, url: 'https://www.youtube.com/watch?v=' + youtubeId }
			matches.push(track)
		}
		this.matches = matches
		console.log(this.matches)
	}

	render() {
		const i = 0
		return html`
			<form @submit=${this.findMatches}>
				<label for="url">Playlist URL</label>
				<input
					type="text"
					name="url"
					value="https://open.spotify.com/playlist/7kqQXkLFuIZFScIuXFaJHe?si=a07c2e4802c54886"
					required
				/><br />
				<p>
					Find your
					<a href="https://developer.spotify.com/dashboard/"
						>Spotify API <code>client id</code> and <code>secret</code>.</a
					><br />
					If you already have a token, this is not needed.
				</p>
				<label for="clientId">Client id</label>
				<input type="text" name="clientId" /><br />
				<label for="clientSecret">Client secret</label>
				<input type="text" name="clientSecret" /><br />
				<label for="token">Spotify token</label>
				<input
					name="token"
					value="BQDqEdX4HJK3N5tcfOPd_gV1f3wc7Bl_7QjWY0jvJ0hkepODJDR6ZWZzMVBqWVGS1Og8vB6v5TcjDILiUq_1jswUjBFb9sknPSZFYEmErrT4CTQlnrWk"
				/><br />
				<button type="submit" ?disabled=${this.loading}>Find matching YouTube videos</button>
			</form>

			<p ?hidden=${!this.loading}>
				<rough-spinner spinner="1" fps="30"></rough-spinner><br />
				Matching ${i}/${this.tracks?.length}...
			</p>

			${this.tracks?.length
				? html` <form @submit=${this.saveMatchingVideos}>
						<ul class="tracks">
							${this.tracks?.map(
								(track, i) => html`<li>
									<strong>${i}. ${track.artist} - ${track.title}</strong>
									<a target="_blank" href=${track.url}>link</a>
									<ul class="results">
										${track.searchResults.map((video) => searchResultTemplate(track, video))}
									</ul>
								</li>`
							)}
						</ul>
						<button type="submit">Confirm matches</button><br />
						<br />
				  </form>`
				: ''}

			${this.matches?.length
				? html`
						<h2>Import tracks to Radio4000</h2>
						<r4-batch-import .matches=${this.matches}></r4-batch-import>
				  `
				: ''}
		`
	}

	// Disable shadow dom
	createRenderRoot() {
		return this
	}
}

const searchResultTemplate = (track, video) => html`
	<li>
		<label>
			<input type="radio" name=${track.id} value=${video.id} />
			<img src=${video.thumbnail} alt=${video.title} />
		</label>
		<ul>
			<li><a href=${`https://www.youtube.com/watch?v=` + video.id} target="_blank">${video.title}</a></li>
			${video.description ? html`<li>${video.description}</li>` : ''}
			<li>
				<small>
					${video.channelTitle ? html`${video.channelTitle}, ` : ''}
					${video.views}${video.publishedAt ? html`, ${video.publishedAt}` : ''}</small
				>
			</li>
		</ul>
	</li>
`
