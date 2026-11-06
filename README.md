# Loop

A responsive React single-page music-loop marketplace concept. Explore and filter sample sounds, upload and play local audio, sign up as a listener or creator, manage a creator catalog, or use the demo admin dashboard. Client-side navigation uses React Router; demo account and upload metadata are stored in localStorage, with audio files stored in IndexedDB.

## Run locally

1. Install Node.js (18+ recommended).
2. From this folder, install dependencies with `npm install`.
3. Start the development server with `npm run dev` and open the local address Vite prints.
4. Check a production build with `npm run build`.

## Demo flows

- Create a listener or creator account from **Join Loop**. For a creator-specific signup, choose Creator.
- Log in and select **Creator** or **Admin** under “Try a demo space” to open those dashboards immediately.
- The creator upload form accepts MP3, WAV, OGG, M4A, AAC, FLAC, and AIFF files up to 100 MB. Uploaded audio is saved in this browser and can be played from Explore; sample cards only show a preview-state toggle.
- Authentication and payment processing are demo-only; no server account, hosting, or payment service is connected.

All demo data is browser-local. Use **Log out** to switch roles; clear local storage and the site's IndexedDB data to reset saved demo accounts, uploads, and audio files.
