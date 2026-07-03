# ─── Stage: production ────────────────────────────────────────────────────────
FROM python:3.11-slim AS production

# ── System hardening ──────────────────────────────────────────────────────────
# - No interactive prompts
# - Upgrade base packages immediately so no known CVEs ship in the image
# - Install only what is needed (wget for healthcheck)
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── Non-root user ─────────────────────────────────────────────────────────────
# Running as root inside a container is a privilege-escalation risk.
RUN groupadd --system appgroup && useradd --system --gid appgroup --no-create-home appuser

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Dependency layer (cached separately from source) ─────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY app/ ./app/

# ── Permissions ───────────────────────────────────────────────────────────────
RUN chown -R appuser:appgroup /app

USER appuser

# ── Runtime config ────────────────────────────────────────────────────────────
EXPOSE 8000

# Healthcheck — backend root endpoint returns 200 within 30 s
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --quiet --tries=1 -O /dev/null http://localhost:8000/ || exit 1

# ── Start server ──────────────────────────────────────────────────────────────
# - 2 workers per (2 × CPU + 1) rule for I/O-bound FastAPI
# - --no-access-log reduces noise; Nginx logs externally
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--no-access-log"]
