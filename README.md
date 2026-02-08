# Jingshin Public Leave System

This is a mobile-ready, public-facing leave application form that stores data in Google Sheets.

## Setup Instructions

### 1. Google Sheets Setup
1. Create a new Google Sheet.
2. Rename the first tab to **"Workers"**.
   - Column A: ID (e.g., 14070)
   - Column B: Name (e.g., 王小明)
   - Column C: Department
3. Create a second tab named **"Applications"**. 
   - Headers: Timestamp, ID, Name, Type, Start, StartTime, End, EndTime, Reason, IP, Device, Status, Sync.

### 2. Google Apps Script
1. In your Sheet, go to **Extensions > Apps Script**.
2. Copy the contents of `google-script/Code.gs` from this project into the editor.
3. Click **Deploy > New Deployment**.
   - Select type: **Web App**.
   - Description: Leave API.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
4. Copy the **Web App URL** (ends in `/exec`).

### 3. Frontend Configuration
1. Create a `.env` file in the root of this project.
2. Paste your URL: `VITE_GOOGLE_SCRIPT_URL=YOUR_URL_HERE`.

### 4. Running Locally
```bash
npm install
npm run dev
```

### 5. GitHub Deployment
1. Push this code to a GitHub Repository.
2. Go to **Settings > Pages** and set up deployment (usually via GitHub Actions for Vite).
3. **IMPORTANT:** In **Settings > Secrets and Variables > Actions**, add your `VITE_GOOGLE_SCRIPT_URL` so the build can use it safely.
