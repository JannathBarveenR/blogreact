# PetOLife — Server Setup & Deployment Guide

> **Who is this for?**  
> Anyone setting up or updating the PetOLife app on a Linux server.  
> No deep technical knowledge required — just follow each step in order.

---

## Before You Begin

You will need:
- A Linux server (Amazon Linux 2023 recommended) with a public IP address
- SSH access to that server (terminal on Mac, or PuTTY on Windows)
- Your Supabase credentials (URL and Service Role Key)
- Your Google OAuth credentials (Client ID and Secret)
- The domain `petolife.com` pointing to your server's IP address in your DNS settings

---

## PART 1 — First-Time Server Setup

Do this **once** when the server is brand new.

---

### Step 1 — Connect to Your Server

On your local machine, open a terminal and run:

```bash
ssh ec2-user@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your actual server IP address. Type `yes` if it asks about authenticity.

---

### Step 2 — Install Git

Git lets the server download your code from GitHub.

```bash
sudo dnf update -y
sudo dnf install -y git
```

Verify it worked:
```bash
git --version
# Should print something like: git version 2.x.x
```

---

### Step 3 — Install Docker

Docker runs the entire application inside isolated containers (no manual Python or Node.js setup needed).

```bash
# Install Docker via DNF
sudo dnf install -y docker

# Start Docker and enable it to run on boot
sudo systemctl start docker
sudo systemctl enable docker

# Allow your user to run Docker without sudo
sudo usermod -aG docker ec2-user

# Apply the new group (or log out and log back in)
newgrp docker
```

Verify Docker works:
```bash
docker --version
# Should print: Docker version 26.x.x

docker compose version
# Should print: Docker Compose version v2.x.x
```

> ⚠️ If `docker compose version` doesn't work, run: `sudo dnf install -y docker-compose-plugin`

---

### Step 4 — Add an SSH Key for GitHub (Private Repo Access)

This lets the server clone your **private** GitHub repository without a password.

**4a. Generate an SSH key on the server:**
```bash
ssh-keygen -t ed25519 -C "petolife-server" -f ~/.ssh/github_deploy -N ""
```

**4b. Copy the public key:**
```bash
cat ~/.ssh/github_deploy.pub
```
This prints a long line starting with `ssh-ed25519 AAAA...`. **Copy the entire line.**

**4c. Add it to GitHub:**
1. Go to [GitHub → Settings → Deploy Keys](https://github.com/PetOlife-26/POL_MVP_V2/settings/keys)
2. Click **"Add deploy key"**
3. Title: `Production Server`
4. Key: paste the line you copied
5. Check **"Allow write access"** → OFF (read-only is fine for cloning)
6. Click **"Add key"**

**4d. Tell SSH to use this key for GitHub:**
```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    IdentityFile ~/.ssh/github_deploy
    User git
EOF
chmod 600 ~/.ssh/config
```

**4e. Test the connection:**
```bash
ssh -T git@github.com
# Should print: Hi PetOLife-26! You've successfully authenticated...
```

---

### Step 5 — Clone the Repository

```bash
# Go to the /opt directory (standard place for apps on Linux)
cd /opt

#Give Access to the reops
 sudo chown -R ec2-user:ec2-user /opt

# Clone the 'deploy' branch (this is the branch with all Docker files)
git clone -b deploy git@github.com:PetOlife-26/POL_MVP_V2.git petolife

# Enter the project folder
cd /opt/petolife
```

---

### Step 6 — Create the Environment Files

The app needs secret keys to connect to Supabase and Google. These are **never stored in GitHub** (for security), so you create them manually on the server.

**6a. Create the root `.env` file (controls Nginx config & CORS):**

```bash
cat > /opt/petolife/.env << 'EOF'
NGINX_CONF=./nginx/nginx.conf
FRONTEND_URL=https://petolife.com
EOF
```

**6b. Create the backend `.env` file (your secret API keys):**

```bash
nano /opt/petolife/backend/.env
```

In the editor that opens, paste your actual credentials:

```
PORT=8000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
FRONTEND_URL=https://petolife.com
```

> **Where do I find these?**
> - Supabase URL & Service Role Key → [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
> - Google Client ID & Secret → [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

Press `Ctrl+X`, then `Y`, then `Enter` to save and exit.

---

### Step 7 — Point Your Domain to the Server

Before getting an SSL certificate, your domain must point to this server.

1. Log into your domain registrar (Squarespace, Namecheap, etc.)
2. Find **DNS Settings** for `petolife.com`
3. Add/update these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |

4. Wait 5–30 minutes for DNS to propagate. Check with:
   ```bash
   dig petolife.com +short
   # Should return YOUR_SERVER_IP
   ```

---

### Step 8 — Get the SSL Certificate (HTTPS)

This makes your site secure with `https://petolife.com`. It's free from Let's Encrypt.

**8a. Start Nginx temporarily with just HTTP (no SSL yet):**
```bash
cd /opt/petolife
NGINX_CONF=./nginx/nginx-http-only.conf docker compose up -d --build
```

Wait ~30 seconds for it to start, then check:
```bash
docker compose ps
# Should show: backend and nginx containers as "Up"
```

**8b. Get the SSL certificate:**
```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@petolife.com \
  --agree-tos \
  --no-eff-email \
  -d petolife.com \
  -d www.petolife.com
```

> ✅ If successful, you'll see: `Successfully received certificate.`
> 
> ❌ If it fails with "DNS problem", wait longer for DNS to propagate and try again.

**8c. Switch to the full production config (with SSL) and restart:**
```bash
docker compose up -d --build
```

---

### Step 9 — Verify Everything is Running

```bash
# Check all containers are healthy
docker compose ps

# You should see something like:
# NAME                    STATUS
# pol_mvp_v2-backend-1   Up (healthy)
# pol_mvp_v2-nginx-1     Up (healthy)
# pol_mvp_v2-certbot-1   Up
```

Open your browser and go to: **https://petolife.com**

The PetOLife app should load with a green padlock in the address bar. 🎉

---

## PART 2 — Updating the App After Code Changes

Whenever a developer pushes new code to the `deploy` branch on GitHub, follow these steps to update the live server.

---

### Step 1 — SSH into the Server

```bash
ssh ec2-user@YOUR_SERVER_IP
```

---

### Step 2 — Go to the Project Folder

```bash
cd /opt/petolife
```

---

### Step 3 — Pull the Latest Code

```bash
git pull
```

This downloads whatever was pushed to the `deploy` branch on GitHub.

---

### Step 4 — Rebuild and Restart the App

```bash
docker compose up -d --build
```

> This command:
> - Rebuilds the React frontend with the new code
> - Rebuilds the FastAPI backend with the new code
> - Restarts the containers with zero downtime (old containers keep running until new ones are ready)

That's it! The live site now has the latest code.

---

## PART 3 — Everyday Useful Commands

Run these from inside `/opt/petolife` on the server.

### View live logs (press Ctrl+C to stop)
```bash
docker compose logs -f
```

### View only backend logs
```bash
docker compose logs -f backend
```

### View only Nginx (web server) logs
```bash
docker compose logs -f nginx
```

### Check container health
```bash
docker compose ps
```

### Restart a single service (without rebuilding)
```bash
docker compose restart backend
docker compose restart nginx
```

### Stop the entire app
```bash
docker compose down
```

### Start the app without rebuilding (faster, no code changes)
```bash
docker compose up -d
```

---

## PART 4 — Troubleshooting

### "Nginx container keeps restarting"
The SSL certificates might be missing. Check:
```bash
docker compose logs nginx
```
If it says `cannot load certificate`, redo Step 8.

### "Backend container is unhealthy"
Check if the backend `.env` has the correct Supabase keys:
```bash
docker compose logs backend
```
Look for lines starting with `[Supabase]`. If it says `MISSING!`, your backend `.env` is incomplete.

### "Site shows a blank page or 404"
```bash
docker compose logs nginx | tail -30
```
If you see `404` for your routes, the Nginx config may not have reloaded:
```bash
docker compose restart nginx
```

### "git pull says 'not a git repository'"
You're in the wrong folder. Make sure you ran:
```bash
cd /opt/petolife
```

### "Permission denied (publickey)" when doing git pull
The SSH deploy key may have been removed from GitHub. Redo Step 4 of Part 1.

### SSL certificate expired (every 90 days — auto-renews!)
The Certbot container handles auto-renewal automatically every 12 hours.
If renewal fails, force renew manually:
```bash
docker compose run --rm certbot renew --force-renewal
docker compose restart nginx
```

---

## Quick Reference Summary

| Task | Command |
|------|---------|
| SSH into server | `ssh ec2-user@YOUR_SERVER_IP` |
| Go to app folder | `cd /opt/petolife` |
| Pull latest code | `git pull` |
| Rebuild & deploy | `docker compose up -d --build` |
| View all logs | `docker compose logs -f` |
| Check status | `docker compose ps` |
| Stop app | `docker compose down` |

---

## File Structure on the Server

```
/opt/petolife/
├── .env                    ← YOU CREATE THIS (production Nginx + CORS settings)
├── .env.example            ← Template — shows what .env needs
├── docker-compose.yml      ← Runs the whole app
├── Dockerfile.frontend     ← Builds React + Nginx
├── nginx/
│   ├── nginx.conf          ← Production HTTPS config (used on server)
│   ├── nginx-local.conf    ← Local HTTP config (used on your Mac)
│   └── nginx-http-only.conf← Used only during first SSL setup
└── backend/
    ├── .env                ← YOU CREATE THIS (Supabase keys, Google OAuth)
    └── Dockerfile          ← Builds FastAPI backend
```

---

*Last updated: June 2026 — PetOLife Deploy Branch*
