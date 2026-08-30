# JobSwipe Dev Server

## Reproduce uncommitted artifacts
- Copy `.env.local` from the main checkout (`/Users/anshi/jobapply-ai/.env.local`) to this worktree root. Contains Razorpay live keys, Gemini API key, SMTP config, etc.
- `npm install` (node_modules already present in this worktree).

## Run the server
```bash
cd /Users/anshi/Desktop/JobSwipe
pm2 start "npx next dev -p 3456" --name jobswipe-preview
```
- Port: **3456**
- pm2 keeps it alive across conversations.
- To stop: `pm2 stop jobswipe-preview && pm2 delete jobswipe-preview`
