import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import {searchYoutube} from './helpers.js'

export default class TextToYoutube extends LitElement {
	static get properties() {
		return {
			inputLines: {type: Array, state: true},
			youtubeResults: {type: Array, state: true},
			loading: {type: Boolean, state: true},
			didConfirmYoutubeResults: {type: Boolean, state: true},
			error: {type: String},
			i: {type: Number},
		}
	}

	maxSearchResults = 3

	// Updates this.tracks
	async findMatches(event) {
		event.preventDefault()
		this.loading = true
		const $form = event.target
		const formData = new FormData($form)
		const lines = formData.get('text_playlist').trim().split('\n')
		if (!lines?.length) throw new Error('Failed to parse your playlist')
		this.inputLines = lines.map((line) => {
			return {
				id: self.crypto.randomUUID(), // to keep track of the track
				title: line,
				searchResults: [], // for later
			}
		})

		// Search YouTube in parallel and render as results come in
		await Promise.allSettled(
			this.inputLines.map((track, i) =>
				searchYoutube(track.title, this.maxSearchResults)
					.then((results) => {
						this.i = i
						this.inputLines[i].searchResults = results
					})
					.catch((error) => {
						console.error('An error occurred:', error)
						this.error = error.message
					}),
			),
		)
		this.loading = false
		console.log('updated inputLines', this.inputLines)
	}

	confirmMatches(event) {
		event.preventDefault()
		this.saveMatchingVideos()
		this.didConfirmMatches = true
		console.log('confirmed matches')
	}

	// Inserts a newline with the YouTube URL for every matched track
	saveMatchingVideos() {
		const fd = new FormData(document.querySelector('form#tracksform'))
		const results = []
		for (const [id, youtubeId] of fd.entries()) {
			const internalTrack = this.inputLines.find((t) => t.id === id)
			const track = {
				...internalTrack,
				youtubeId,
				url: 'https://www.youtube.com/watch?v=' + youtubeId,
			}
			results.push(track)
		}
		this.youtubeResults = results
		console.log('saved matches', this.youtubeResults)
	}

	clearMatches() {
		this.inputLines = []
		this.youtubeResults = []
		this.i = 0
	}

	skipTrack(event, track) {
		event.preventDefault()
		this.inputLines = this.inputLines.filter((t) => t.id !== track.id)
		localStorage.setItem('syr.tracks', JSON.stringify(this.inputLines))
	}

	render() {
		return html`
			<section>
				<details open>
					<summary>Step 1. Write the tracks you want</summary>
					<form @submit=${this.findMatches}>
						<label for="text_playlist">Text playlist</label><br />
						<textarea name="text_playlist" id="text_playlist" rows="20" required>
joy orbison in drink
tierra hungry hippo
burger ink elvism
</textarea
						><br />
						<button type="submit" ?disabled=${this.loading}>Import</button>
					</form>
					${this.error
						? html` <p>Error! Could not fetch this playlist. Is it public?<br /><code>${this.error}</code></p> `
						: null}
					<p ?hidden=${!this.loading}>
						Matching ${Number(this.i || 0) + 1}/${this.inputLines?.length}...
						<rough-spinner spinner="1" fps="30"></rough-spinner><br />
					</p>
				</details>
			</section>

			<section youtube>
				<details ?open=${this.inputLines?.length && !this.didConfirmMatches}>
					<summary>Step 2. Confirm your YouTube tracks</summary>
					<p>For each track decide which matching YouTube video to keep, or skip.</p>
					${this.inputLines?.length
						? html` <form id="tracksform" @input=${this.saveMatchingVideos} @submit=${this.confirmMatches}>
								<ul class="tracks">
									${this.inputLines?.map(
										(track, i) => html`
											<li>
												<button @click=${(event) => this.skipTrack(event, track)}>Skip</button>
												<strong>${i}. ${track.artist} - ${track.title}</strong>
												<a target="_blank" href=${track.url}>link</a>
												<ul class="results">
													${track.searchResults.map((video, i) =>
														searchResultTemplate(track, i, video, this.youtubeResults),
													)}
												</ul>
											</li>
										`,
									)}
								</ul>
								<p>
									<button type="submit">Confirm matches</button> or
									<button @click=${this.clearMatches}>Start over</button>
								</p>
							</form>`
						: ''}
				</details>
			</section>

			<section matches>
				<details ?open=${this.didConfirmMatches && this.youtubeResults?.length}>
					<summary>Results</summary>
					<p>Here are the tracks you chose. Do with it as you please.</p>
					<ul>
						${this.youtubeResults?.map(
							(match, i) => html`
								<li>
									<strong>${i}. ${match.title}</strong>
								</li>
							`,
						)}
					</ul>
					<p>Copy paste as CSV</p>
					<textarea rows=${this.youtubeResults?.length}>
title;youtube
${this.youtubeResults?.map((m) => `${m.title.replace(';', '')};${m.youtubeId}\n`)}</textarea
					>
					<p>Copy paste the YouTube IDs</p>
					<textarea rows=${this.youtubeResults?.length}>
${this.youtubeResults?.map((m) => m.youtubeId + '\n')}</textarea
					>
					<p>Copy paste the YouTube URLs</p>
					<textarea rows=${this.youtubeResults?.length}>
${this.youtubeResults?.map((m) => 'https://www.youtube.com/watch?v=' + m.youtubeId + '\n')}</textarea
					>
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
			<li>
				<a href=${`https://www.youtube.com/watch?v=` + video.id} target="_blank">${video.title}</a>
			</li>
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
