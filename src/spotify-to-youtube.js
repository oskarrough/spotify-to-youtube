import { LitElement, html } from 'https://unpkg.com/lit?module'
import {
	extractSpotifyPlaylistId,
	getSpotifyPlaylist,
	searchYoutube,
} from './helpers.js'

export default class SpotifyToYoutube extends LitElement {
	static get properties() {
		return {
			tracks: { type: Array, state: true },
			matches: { type: Array, state: true },
			loading: { type: Boolean, state: true },
			confirmedMatches: { type: Boolean, state: true },
		}
	}

	// spotifyToken = ''
	// maxTracks = 2
	maxSearchResults = 3

	connectedCallback() {
		super.connectedCallback()
		// Restore tracks and matches from localstorage, if present
		const tracks = localStorage.getItem('syr.tracks')
		if (tracks) this.tracks = JSON.parse(tracks)
		const matches = localStorage.getItem('syr.matches')
		if (matches) this.matches = JSON.parse(matches)
	}

	// Updates this.tracks
	async findMatches(event) {
		event.preventDefault()
		this.isLoading = true
		const $form = event.target
		const formData = new FormData($form)

		// Query the playlist
		try {
			const playlistId = extractSpotifyPlaylistId(formData.get('url'))
			const playlist = await getSpotifyPlaylist(playlistId)
      if (!playlist) throw new Error('Failed to fetch Spotify playlist')
			this.tracks = this.maxTracks ? playlist.tracks.slice(0, this.maxTracks) : playlist.tracks
			// Search YouTube and render as results come in
			for (const [i, t] of Object.entries(this.tracks)) {
				this.tracks[i].searchResults = await searchYoutube(t.artist, t.title, this.maxSearchResults)
				this.requestUpdate()
			}
			console.log('Setting tracks', this.tracks)
			localStorage.setItem('syr.tracks', JSON.stringify(this.tracks))
		} catch (error) {
			console.error('An error occurred:', error)
		} finally {
			this.loading = false
		}
	}

	confirmMatches(event) {
		this.saveMatchingVideos(event)
		event.preventDefault()
		console.log('confirmMatches')
		this.confirmedMatches = true
	}

	// Inserts a newline with the YouTube URL for every matched track
	saveMatchingVideos(event) {
		event.preventDefault()

		const fd = new FormData(event.currentTarget)

		const matches = []
		for (const [spotifyId, youtubeId] of fd.entries()) {
			const spotifyTrack = this.tracks.find((t) => t.id === spotifyId)
			const title = spotifyTrack.artist + ' - ' + spotifyTrack.title
			const track = { spotifyId, youtubeId, title, url: 'https://www.youtube.com/watch?v=' + youtubeId }
			matches.push(track)
		}
		this.matches = matches
		console.log('saving tracks & matches', this.matches)
		localStorage.setItem('syr.tracks', JSON.stringify(this.tracks))
		localStorage.setItem('syr.matches', JSON.stringify(this.matches))
	}

	clearMatches() {
		this.tracks = []
		this.matches = []
		localStorage.removeItem('syr.tracks')
		localStorage.removeItem('syr.matches')
	}

  skipTrack(event, track) {
    event.preventDefault()
    this.tracks = this.tracks.filter(t => t.id !== track.id)
		localStorage.setItem('syr.tracks', JSON.stringify(this.tracks))
  }

	render() {
		const i = 0
		return html`
			<details ?open=${!this.tracks?.length}>
				<summary>Step 1. Import Spotify playlist</summary>
        <form @submit=${this.findMatches}>
          <label for="url">URL</label>
          <input
            type="text"
            name="url"
            value="https://open.spotify.com/playlist/7kqQXkLFuIZFScIuXFaJHe?si=a07c2e4802c54886"
            required
          /><br />
          <button type="submit" ?disabled=${this.loading}>Find matching YouTube videos</button>
        </form>
			</details>

			<p ?hidden=${!this.loading}>
				<rough-spinner spinner="1" fps="30"></rough-spinner><br />
				Matching ${i}/${this.tracks?.length}...
			</p>

			<details ?open=${this.tracks?.length && !this.confirmedMatches}>
				<summary>Step 2. Choose your videos</summary>
			  ${this.tracks?.length ? html`
          <form @input=${this.saveMatchingVideos} @submit=${this.confirmMatches}>
						<ul class="tracks">
							${this.tracks?.map(
								(track, i) => html`<li>
									<strong>${i}. ${track.artist} - ${track.title}</strong>
									<a target="_blank" href=${track.url}>link</a>
                  <button @click=${(event) => this.skipTrack(event, track)}>skip</button>

									<ul class="results">
										${track.searchResults.map((video, i) => searchResultTemplate(track, i, video, this.matches))}
									</ul>
								</li>`
							)}
						</ul>
						<button type="submit">Confirm matches</button><br />
					<button @click=${this.clearMatches}>Clear all</button><br />
				  </form>`
				: ''}
			</details>

			<details ?open=${this.matches?.length}>
				<summary>Step 3. Import tracks to Radio4000</summary>
				<r4-batch-import .matches=${this.matches}></r4-batch-import>
			</details>
		`
	}

	// Disable shadow dom
	createRenderRoot() {
		return this
	}
}

const searchResultTemplate = (track, index, video, matches) => html`
	<li>
		<label>
			<input
				type="radio"
				name=${track.id}
				value=${video.id}
				?checked=${matches?.find((x) => x.youtubeId === video.id) || index === 0}
			/>
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
