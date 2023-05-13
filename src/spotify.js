// Gets an access token from Spotify
export async function getAccessToken(clientId, clientSecret) {
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	})

	if (!response.ok) {
		throw new Error('Failed to retrieve access token')
	}

	const data = await response.json()
	return data.access_token
}

// Extract playlist ID from Spotify URL
export function extractSpotifyPlaylistId(url) {
	const regex = /playlist\/(\w+)/
	const match = url.match(regex)
	return match ? match[1] : null
}

// Fetch Spotify playlist tracks
export function getSpotifyPlaylist(playlistId, token) {
	const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
	if (!token) throw new Error('Missing Spotify access token')
	return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
		.then((response) => response.json())
		.then((data) => data.items)
		.catch((error) => {
			console.log(error)
			throw new Error('Failed to fetch Spotify playlist.')
		})
}

// Take what we need from the response.
export function parseSpotifyTrack({ track }) {
	return {
		id: track.id,
		isrc: track.external_ids.isrc,
		artist: track.artists[0].name,
		title: track.name,
		preview_url: track.preview_url,
		image: track.album.images[0].url,
		searchResults: [],
	}
}
