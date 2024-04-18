import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { sdk } from 'https://cdn.jsdelivr.net/npm/@radio4000/sdk@latest/+esm'

/**
 * @typedef {Object} Match
 * @property {string} spotifyId
 * @property {string} youtubeId
 * @property {string} title
 * @property {string} url
 */

export default class R4BatchImport extends LitElement {
	static get properties() {
		return {
			matches: { type: Array },
			channel: { type: Object, state: true },
			loading: { type: Boolean, reflect: true}
		}
	}

	async connectedCallback() {
		super.connectedCallback()
		const {data: user} = await sdk.users.readUser()
		if (user) this.setChannel()
	}

	async onSignIn({ detail }) {
		if (detail.error) throw new Error('Could not sign in')
		this.setChannel()
	}

	async setChannel() {
		const { data: channels } = await sdk.channels.readUserChannels()
		this.channel = channels?.length ? channels[0] : null
	}

	logout() {
		sdk.auth.signOut()
		this.channel = undefined
	}

	async submit(event) {
		this.loading = true
		event.preventDefault()
		for (const x of this.matches) {
			await sdk.tracks.createTrack(this.channel.id, {
				url: x.url,
				title: x.title,
			})
		}
		this.loading = false
    alert('Success! All tracks were imported')
	}

	render() {
		return html`
			${this.channel
				? html`
						${this.matches?.length
							? html`
									<p>
										${this.matches?.length} tracks will be imported to your Radio4000 channel:
										<strong>${this.channel.name}</strong> (@${this.channel.slug})
									</p>
									<form @submit=${this.submit}>
										<button type="submit" ?disabled=${this.loading}>
                      ${this.loading ? 'Importing...' : 'Import'}
                    </button>
									</form>
									<br />
							  `
							: html`<p>Waiting for matches...</p>`}
						<button @click=${this.logout}>Logout of R4</button>
				  `
				: html`<p>Sign in to Radio4000 to import a bunch of tracks</p>
						<r4-sign-in @submit=${this.onSignIn}></r4-sign-in>`}
		`
	}
}
