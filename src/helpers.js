// Extract playlist ID from Spotify URL
export function extractSpotifyPlaylistId(url) {
	const regex = /playlist\/(\w+)/
	const match = url.match(regex)
	return match ? match[1] : null
}

// Fetch Spotify playlist tracks
export function getSpotifyPlaylist(id) {
	// const url = `https://api.spotify.com/v1/playlists/${id}/tracks`
	const url = `https://medianow.deno.dev/spotify/playlists/${id}`
	return fetch(url)
		.then((response) => response.json())
		.then(parseSpotifyPlaylistReponse)
		.catch((error) => {
			console.log(error)
			throw new Error('Failed to fetch Spotify playlist.')
		})
}

function parseSpotifyPlaylistReponse(res) {
	console.log('Fetched Spotify API', res.data.playlistV2)
	return {
		name: res.data.playlistV2.name,
		owner: res.data.playlistV2.ownerV2.data.username,
		tracks: res.data.playlistV2.content.items.map(parseSpotifyTrack)
	}
}

// Take what we need from the response.
export function parseSpotifyTrack(track) {
	return {
		id: track.uid,
		url: `https://open.spotify.com/track/${track.uid}`,
		artist: track.item.data.artists.items[0].profile.name,
		title: track.item.data.name,
		image: track.item.data.albumOfTrack.coverArt.sources[0].url,
		searchResults: [],
	}
}

/**
 * @arg {string} query
 * @arg {number} [limit]
 */
export async function searchYoutube(query, limit) {
	const response = await fetch(`https://medianow.deno.dev/youtube/search?query=${encodeURIComponent(query)}`)
	const results = await response.json()
	if (limit) return results.slice(0, limit)
	return results
}

