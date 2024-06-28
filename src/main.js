import 'https://cdn.jsdelivr.net/npm/@radio4000/components/dist/r4.js'
import 'https://cdn.jsdelivr.net/gh/oskarrough/rough-spinner/rough-spinner.js'
import '@github/tab-container-element'

import SpotifyToYoutube from './spotify-to-youtube.js'
import TextToYoutube from './text-to-youtube.js'
import R4BatchImport from './r4-batch-import.js'

customElements.define('spotify-to-youtube', SpotifyToYoutube)
customElements.define('text-to-youtube', TextToYoutube)
customElements.define('r4-batch-import', R4BatchImport)
