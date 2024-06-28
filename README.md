# Convert Spotify playlist → YouTube videos → Radio4000 tracks

A set of JavaScript functions and a web component to help convert the tracks in a Spotify playlist to YouTube videos, and optionally move them to Radio4000 as well.

1. Input a Spotify playlist URL (limit 500 tracks)
2. Allow the tool to search for possible matching YouTube videos
3. Select the matches you want
4. Import list of YouTube videos into Radio4000 (beta)

Try it out on https://oskarrough.github.io/spotify-to-youtube/

## Development

- The tool is made with web components and uses vite as build system.  
- The `main` branch auto-deploys via GitHub pages.
- It reads data from Spotify and YouTube via https://github.com/radio4000/media-now-deno
- It inserts data into Radio4000 using https://github.com/radio4000/sdk

```
graph TD
  url[Spotify Playlist URL] -->|parse string| id[Playlist ID]
   -->|Spotify API| playlist[Playlist with tracks] -->|YouTube API| searchResults[Find matching YouTube videos]
   -->|UI component| matches{Select best matches} -.-> r4[Optional import to Radio4000]
```
