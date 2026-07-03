# PetOLife — Production Deployment Guide

## Architecture

```
Internet (port 80/443)
        │
        ▼
  ┌─────────────┐
  │    Nginx    │  ← SSL termination, rate limiting, static files
  │  container  │
  └──────┬──────┘
         │  (internal Docker network only)
         ▼
  ┌─────────────┐
  │   FastAPI   │  ← backend:8000 (NOT exposed to internet)
  │   backend   │
  └──────┬──────┘
         │  (HTTPS — external)
         ▼
  ┌─────────────┐
  │  Supabase   │  ← Cloud DB (no change)
  │   Cloud     │
  └─────────────┘
```

## Public URLs

| URL | What it does |
|-----|-------------|
| `https://petolife.com/` | React SPA (frontend) |
| `https://petolife.com/api/v1/auth/login` | FastAPI login |
| `https://petolife.com/api/v1/pet-profile/` | Pet profile API |
| `https://petolife.com/api/v1/care-team/` | Care team API |

> **URL rewrite**: Nginx strips `/api/v1` and forwards to FastAPI as `/api/...`
> No code changes were needed — your backend routes stay the same.

---

## File Map

```
POL_MVP_V2/
├── docker-compose.yml          ← ONE file — works locally AND on the server
├── Dockerfile.frontend         ← Multi-stage: Node 20 builds React → Nginx serves SPA
├── .env                        ← NOT committed (gitignored) — controls environment
├── .env.example                ← Template: copy to .env and fill in values
├── .dockerignore               ← Root-level build context exclusions
│
├── backend/
│   ├── Dockerfile              ← Python 3.11-slim, non-root user, healthcheck
│   ├── .dockerignore           ← Excludes venv, .env, __pycache__ from image
│   └── .env                    ← Backend secrets (NOT committed to git)
│
└── nginx/
    ├── nginx.conf              ← Production config (HTTPS + SSL + rate limiting)
    ├── nginx-local.conf        ← Local config (HTTP only, localhost, no SSL)
    └── nginx-http-only.conf    ← Bootstrap config for first-time SSL setup on server
```

---

## How Environment Switching Works

The **root `.env` file** controls which Nginx config is used and the CORS origin.

| Variable | Local value | Production value |
|----------|-------------|-----------------|
| `NGINX_CONF` | `./nginx/nginx-local.conf` | `./nginx/nginx.conf` |
| `FRONTEND_URL` | `http://localhost` | `https://petolife.com` |

**Same `docker compose up -d --build` command works in both environments.**

---

## Local Testing (Your Mac)

```bash
# 1. Make sure .env exists with local defaults
cp .env.example .env   # if .env doesn't exist yet

# 2. Start everything
docker compose up -d --build

# 3. Open browser
open http://localhost/

# 4. View logs
docker compose logs -f

# 5. Stop
docker compose down
```

---

## First-Time Server Setup

### 1. Prerequisites (on your server)

```bash
# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # then log out and back in

# Verify
docker --version
docker compose version
```

### 2. Clone your repo

```bash
git clone <your-repo-url> /opt/petolife
cd /opt/petolife
```

### 3. Create the server .env file

```bash
# Create production root .env
cat > .env << 'EOF'
NGINX_CONF=./nginx/nginx.conf
FRONTEND_URL=https://petolife.com
EOF

# Also ensure backend/.env has your Supabase secrets
# (copy from your local backend/.env — it's gitignored)
```

### 4. SSL Certificate (Let's Encrypt)

> ⚠️ Your domain's DNS A record must already point to this server before running this.

**Step A** — Temporarily start with the HTTP-only config so Certbot can reach your server:
```bash
# Temporarily override NGINX_CONF to the http-only config
NGINX_CONF=./nginx/nginx-http-only.conf docker compose up -d --build
```

**Step B** — Get the certificate:
```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@petolife.com \
  --agree-tos \
  --no-eff-email \
  -d petolife.com \
  -d www.petolife.com

echo "✅ Certificate obtained!"
```

**Step C** — Switch to the full production config:
```bash
docker compose up -d --build
# (reads NGINX_CONF=./nginx/nginx.conf from your .env)
```

### 5. Verify

```bash
# Check all containers are healthy
docker compose ps

# Test the API
curl https://petolife.com/api/v1/

# Test frontend
curl -I https://petolife.com/

# Check security headers
curl -I https://petolife.com/ | grep -E "(Strict|X-Frame|X-Content)"
```

---

## Day-to-Day Operations

### Deploy a code update

```bash
git pull
docker compose up -d --build
```

### View logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Nginx access log
docker compose logs -f nginx

# Rate-limited requests (429s)
docker compose logs nginx | grep " 429 "
```

### Restart a service

```bash
docker compose restart backend
docker compose restart nginx
```

### Stop everything

```bash
docker compose down
```

---

## DNS & IP Privacy (Squarespace)

> The `dig petolife.com` command will always return the IP of your server — this is by design for DNS.
> To hide your server's real IP:
> 1. **Use Cloudflare as a proxy** (free plan, enable "Proxied" on your A record) — this replaces your IP with Cloudflare's
> 2. Or accept that the IP is visible; Nginx's `server_tokens off` hides the **server software** version

If you're using Squarespace DNS:
- Add an **A record**: `@` → `<your server IP>`
- Add an **A record**: `www` → `<your server IP>`
- TTL: 300 (for quick propagation)

---

## Rate Limiting Details

| Zone | Limit | Burst | Applies to |
|------|-------|-------|-----------| 
| `global_limit` | 30 req/s = **300 req/10s** per IP | 50 | All `/api/v1/*` |
| `auth_limit` | 1 req/s = **10 req/10s** per IP | 5 | `/api/v1/auth/login`, `/signup`, `/google` |
| `conn_limit` | 20 simultaneous connections | — | All requests |

When exceeded: **HTTP 429 Too Many Requests** (connection dropped)

---

## Scaling (Future)

To add more backend instances for load balancing, edit `nginx/nginx.conf`:

```nginx
upstream petolife_backend {
    server backend:8000;
    server backend_2:8000;   # add new replica
    server backend_3:8000;
    keepalive 32;
}
```

And in `docker-compose.yml`:
```yaml
backend:
  deploy:
    replicas: 3
```
