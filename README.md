# Convert Spotify playlist → YouTube videos → Radio4000 tracks

1. Input a Spotify playlist URL
2. Allow the tool to search for possible matching YouTube videos
3. Select the matches you want
4. Import list of YouTube videos into Radio4000 (beta)

## Development

The tool is made with web components and uses vite as build system.  
The `main` branch auto-deploys via GitHub pages.

It reads data from Spotify and YouTube via https://github.com/radio4000/youtube-search  
It inserts data into Radio4000 using https://github.com/radio4000/sdk
