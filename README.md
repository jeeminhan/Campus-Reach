# Campus Reach

Next.js app for exploring international student origin countries and unreached people groups.

## Local Setup

1. Install deps: `npm install`
2. Create env file: `cp .env.example .env.local`
3. Add your key to `.env.local`
4. Start dev server: `npm run dev`

## Vercel Deploy

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. In Vercel Project Settings -> Environment Variables, add:
   - `JOSHUA_PROJECT_API_KEY`
4. Deploy.

Notes:
- The people-groups API route runs on Node.js runtime.
- Function timeout is capped to keep responses fast if upstream API is slow.
