# Deploying HTML to Android APK Platform to Vercel

This repository is configured for 1-click deployment on [Vercel](https://vercel.com).

---

## 1. Architecture on Vercel

```
                                  +-----------------------------+
                                  |   Vercel Global CDN (Edge)  |
                                  |     React 19 Dashboard      |
                                  +--------------+--------------+
                                                 |
                                                 | HTTPS API Calls (VITE_API_URL)
                                                 v
                                  +-----------------------------+
                                  |     Android Build Backend   |
                                  |  Local PC / VPS / Cloud VM  |
                                  |   (Java 21 + Android SDK)   |
                                  +-----------------------------+
```

### Why is the architecture split?
- **Vercel** is an edge/serverless platform optimized for web frontends. Serverless functions on Vercel have size limits (50–250 MB) and execution timeouts (10–60 seconds), and cannot run the 4GB+ native Android SDK and Gradle toolchain.
- **Vercel hosts the beautiful React 19 web dashboard** globally with sub-second response times.
- **The Backend & Build Engine** runs on your Linux/Windows machine or a cloud VPS (e.g., Render, Railway, DigitalOcean, AWS EC2) where Java and the Android SDK reside.

---

## 2. Deploying to Vercel via GitHub (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Git Repository** and select:
   ```
   MARK2273/Html-To-APK
   ```
3. Vercel will automatically detect `vercel.json` and configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm --prefix apps/frontend run build`
   - **Output Directory**: `apps/frontend/dist`
4. *(Optional)* In **Environment Variables**, add:
   - `VITE_API_URL`: URL of your backend (e.g., `https://your-backend.onrender.com` or `http://localhost:3001` if accessing via local network/tunnel).
5. Click **Deploy**!

---

## 3. Connecting to the Local Backend via Cloudflare Tunnel / Ngrok

If your backend is running locally on your PC and your frontend is hosted on Vercel:
```bash
# Expose your local backend port 3001 safely:
npx ngrok http 3001
# Or with Cloudflare:
cloudflared tunnel --url http://localhost:3001
```
Then paste that HTTPS tunnel URL into the `VITE_API_URL` environment variable on Vercel!

