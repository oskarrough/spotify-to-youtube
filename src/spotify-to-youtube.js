import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
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
			error: {type: String},
			i: {type: Number}
		}
	}

	// spotifyToken = ''
	// maxTracks = 2
	maxSearchResults = 4

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
		this.loading = true
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
				console.log(i)
				this.tracks[i].searchResults = await searchYoutube(`${t.artist} ${t.title}`, this.maxSearchResults)
				this.i = i
				// this.requestUpdate()
			}
			console.log('Setting tracks', this.tracks)
			localStorage.setItem('syr.tracks', JSON.stringify(this.tracks))
		} catch (error) {
			console.error('An error occurred:', error)
			this.error = error.message
		} finally {
			this.loading = false
		}
	}

	confirmMatches(event) {
		event.preventDefault()
		this.saveMatchingVideos()
		this.confirmedMatches = true
		console.log('confirmed matches')
	}

	// Inserts a newline with the YouTube URL for every matched track
	saveMatchingVideos() {
		const fd = new FormData(document.querySelector('form#tracksform'))
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
		return html`
			${this.tracks?.length ? html`
				<p><button @click=${this.clearMatches}>Start over</button></p>` : null}
			<section spotify>
			<details ?open=${!this.tracks?.length}>
				<summary>Step 1. Import Spotify playlist</summary>
				<form @submit=${this.findMatches}>
					<label for="url">A public Spotify playlist URL</label>
					<input type="text" name="url" id="url" value="https://open.spotify.com/playlist/44l2AC9bKrAnMTSz7eIe7H" required /><br />
					<button type="submit" ?disabled=${this.loading}>Import</button>
				</form>
				${this.error ? html`
					<p>Error! Could not fetch this playlist. Is it public?<br/><code>${this.error}</code></p> ` : null}
				<p ?hidden=${!this.loading}>
					Matching ${Number(this.i || 0) + 1}/${this.tracks?.length}...
					<rough-spinner spinner="1" fps="30"></rough-spinner><br />
				</p>
			</details>

			</section>

			<section youtube>
			<details ?open=${this.tracks?.length && !this.confirmedMatches}>
				<summary>Step 2. Confirm your YouTube tracks</summary>
				<p>For each track decide which matching YouTube video to keep, or skip.</p>
				${this.tracks?.length ? html`
					<form id="tracksform" @input=${this.saveMatchingVideos} @submit=${this.confirmMatches}>
						<ul class="tracks">
							${this.tracks?.map((track, i) => html`
								<li>
									<button @click=${(event) => this.skipTrack(event, track)}>Skip</button>
									<strong>${i}. ${track.artist} - ${track.title}</strong>
									<a target="_blank" href=${track.url}>link</a>
									<ul class="results">
										${track.searchResults.map((video, i) => searchResultTemplate(track, i, video, this.matches))}
									</ul>
								</li>
							`)}
						</ul>
						<p>
							<button type="submit">Confirm matches</button> or <button @click=${this.clearMatches}>Start over</button>
						</p>
					</form>`
					: ''}
			</details>
			</section>


			<section matches>
			<details>
				<summary>3. Step 3</summary>
				<p>There is no step 3.</p>
			</details>

			<details ?open=${this.confirmedMatches && this.matches?.length}>
				<summary>Results</summary>
				<p>Here are the tracks you chose. Do with it as you please.</p>
				<ul>
				${this.matches?.map((match, i) => html`
					<li>
						<strong>${i}. ${match.title}</strong>
					</li>
				`)}
				</ul>
				<p>Copy paste as CSV</p>
				<textarea rows=${this.matches?.length}>title;spotify;youtube
${this.matches?.map(m => `${m.title.replace(';', '')};${m.spotifyId};${m.youtubeId}\n`)}</textarea>
				<p>Copy paste the YouTube IDs</p>
				<textarea rows=${this.matches?.length}>${this.matches?.map(m => m.youtubeId + '\n')}</textarea>
				<p>Copy paste the YouTube URLs</p>
				<textarea rows=${this.matches?.length}>${this.matches?.map(m => 'https://www.youtube.com/watch?v=' + m.youtubeId + '\n')}</textarea>
				<p>Copy paste to <a href="https://ugrp.gitlab.io/protos/r4-text">r4-text</a></p>
				<textarea rows=${this.matches?.length}>${this.matches?.map(m => m.title+'\n'+'https://www.youtube.com/watch?v=' + m.youtubeId + '\n\n')}</textarea>
			</details>
			</section>

			<section r4>
			<details ?open=${this.matches?.length}>
				<summary>Optional step 4. Import tracks to Radio4000 beta</summary>
				<p><small>Note, already imported tracks will be duplicated.</small></p>
				<r4-batch-import .matches=${this.matches}></r4-batch-import>
			</details>
			</section>
		`
	}

	// Disable shadow dom
	createRenderRoot() {
		return this
	}
}

function selectedVideo(event) {
	const top = event.target.closest('ul').parentElement.nextElementSibling?.offsetTop
	if (top) window.scrollTo({top, behaviour: 'smooth'})
}

const searchResultTemplate = (track, index, video, matches) => html`
	<li>
		<label>
			<input
				type="radio"
				name=${track.id}
				value=${video.id}
				?checked=${matches?.find((x) => x.youtubeId === video.id) || index === 0}
				@input=${selectedVideo}
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
