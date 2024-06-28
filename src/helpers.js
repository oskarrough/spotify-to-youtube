// Extract the ID from a Spotify playlist URL
export function extractSpotifyPlaylistId(url) {
	const regex = /playlist\/(\w+)/
	const match = url.match(regex)
	return match ? match[1] : null
}

// Fetch and parse Spotify playlist tracks
export async function getSpotifyPlaylist(id) {
	const url = `https://medianow.deno.dev/spotify/playlists/${id}`
	try {
        const response = await fetch(url)
        const res = await response.json()
        return parseSpotifyPlaylistReponse(res)
    } catch (error) {
        throw new Error(error.message)
    }
}

// Take what we need from the Spotify API playlist response.
function parseSpotifyPlaylistReponse(res) {
	if (res.data.playlistV2.__typename === 'NotFound') throw new Error(res.data.playlistV2.message)
	console.log('parseSpotifyPlaylistResponse', res.data)
	return {
		name: res.data.playlistV2.name,
		owner: res.data.playlistV2.ownerV2.data.username,
		tracks: res.data.playlistV2.content.items.map(parseSpotifyTrack),
	}
}

// Take what we need from the Spotify API track response.
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
 * Searches YouTube videos
 * @param {string} query - search query
 * @param {number=} limit - optionally only return x items
 * @returns {Promise<MediaNowYouTubeSearchResult[]>} - array of YouTube videos
 */
export async function searchYoutube(query, limit) {
	const response = await fetch(`https://medianow.deno.dev/youtube/search?query=${encodeURIComponent(query)}`)
	const results = await response.json()
	if (limit) return results.slice(0, limit)
	return results
}

/**
 * @typedef {object} MediaNowYouTubeSearchResult
 * @prop {string} id
 * @prop {string} title
 * @prop {string} thumbnail
 * @prop {string} views - like "31,259,673 views"
 * @prop {string} publishedAt - something like "13 years ago"
 * @prop {string} channelTitle
 */
