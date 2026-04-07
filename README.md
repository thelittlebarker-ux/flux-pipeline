# FLUX Sales Pipeline — Cloud Team Dashboard

A cloud-hosted sales pipeline tracker for your team. Anyone with the URL sees the same data.

## Deploy in 10 Minutes (Free)

### Option 1: Render.com (Recommended — Free)

1. **Create a GitHub account** (if you don't have one): https://github.com/signup
2. **Create a new repository**: Click "New" → name it `flux-pipeline` → Upload these files
3. **Sign up at Render.com**: https://render.com (sign in with GitHub)
4. **Click "New" → "Web Service"**
5. **Connect your `flux-pipeline` repo**
6. Render auto-detects the settings. Just click **"Create Web Service"**
7. Wait 2-3 minutes for deploy
8. **Your URL**: `https://flux-pipeline-xxxx.onrender.com`
9. Share that URL with your team — everyone sees the same dashboard!

### Option 2: Railway.app

1. Go to https://railway.app → Sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `flux-pipeline` repo
4. Railway auto-deploys. Get your URL from Settings → Domains.

### Option 3: Run Locally

```bash
npm install
npm start
# Open http://localhost:3000
```

## How It Works

- **Server**: Express.js saves pipeline data as a JSON file
- **Database**: Simple file-based (no MySQL/Postgres needed)
- **Frontend**: Full React dashboard with 8 views
- **Team sync**: Everyone hits the same server = same data
- **Data persists**: Stored on the server disk, survives restarts

## Usage

1. Open the URL
2. Click "Import" → upload your Platform Reservations Excel
3. Assign agents, update stages, add notes
4. Share the URL with your team
5. They see everything in real-time (on page refresh)

## Files

```
flux-cloud/
├── server.js           # Express API server (50 lines)
├── package.json        # Dependencies
├── render.yaml         # Render.com deploy config
├── public/
│   └── index.html      # Full React dashboard (single file)
└── data/
    └── pipeline.json   # Auto-created on first save
```
