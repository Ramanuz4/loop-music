# Loop Music

A responsive Next.js portal for artists and the Loop team. Artist demo accounts and uploads are browser-local; uploaded audio files are saved in IndexedDB.

## Run locally

1. Install Node.js 20.9 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a random `ADMIN_SESSION_SECRET` of at least 32 bytes.
4. Start the app with `npm run dev` and open the local address it prints.
5. Check a production build with `npm run build`.

The local `.env.local` contains private development credentials and must never be committed. Configure the same environment variables in the deployment environment before enabling admin access there. Admin sessions use an eight-hour, signed, HttpOnly cookie.

## Demo flows

- Create an artist demo account from **Sign Up** or use the artist demo button.
- Loop team members can sign in at `/admin/login`. Admin credentials are checked server-side; direct `/admin` routes require a valid session.
- The artist upload form accepts MP3, WAV, OGG, M4A, AAC, FLAC, and AIFF files up to 100 MB. Uploaded audio is saved in this browser.

Artist demo authentication and data are browser-local. Admin authentication is configured with server-only environment variables. Admin access should use a dedicated authentication provider, a strong unique password, and rate limiting before production use.
