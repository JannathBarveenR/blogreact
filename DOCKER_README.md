# PetOLife Docker Setup (Nginx Edition)

This document explains the containerized architecture for PetOLife.

## Architecture Overview

The application runs via `docker-compose.yml` with two tightly-coupled containers:

1. **`frontend` (Nginx + React SPA)**
   - Built from `Dockerfile.frontend`.
   - Compiles the React application into static HTML/JS/CSS assets.
   - Uses an **Nginx** alpine image to serve the static assets on port `80`.
   - Contains a built-in reverse proxy configuration that routes any requests starting with `/api/*` to the backend container.
   - Binds to port `80` on the host machine.

2. **`backend` (FastAPI + Python)**
   - Built from `backend/Dockerfile`.
   - Runs the FastAPI application using Uvicorn.
   - Listens on internal port `8000` (not exposed to the host directly, only accessible via the frontend proxy).

## How to Run Locally

1. **Environment Variables**:
   Copy the example environment files to create your local configurations.
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
   *Note: Populate these files with your actual Supabase keys and database credentials.*

2. **Start the Containers**:
   ```bash
   docker compose up -d --build
   ```

3. **Access the Application**:
   - The frontend application will be available at: `http://localhost`
   - The backend API will be accessible via: `http://localhost/api` (proxied by Nginx)

## Production Deployment (AWS)

In production, the `docker-compose.yml` file is executed exactly the same way. The infrastructure surrounding it is responsible for traffic routing and SSL:

- **SSL/HTTPS**: Terminated at the AWS CloudFront CDN edge.
- **Routing**: AWS Application Load Balancer (ALB) routes port 80 traffic to the EC2 instances.
- **Nginx**: The `frontend` container receives the port 80 traffic from the ALB and serves the app.
- **Secrets**: `.env` files are not stored in the repository. Instead, the AWS Auto Scaling Group's User Data script fetches them securely from AWS Secrets Manager and writes them to the EC2 instance right before running `docker compose up`.

## Modifying the Nginx Configuration
If you need to change caching rules, add new reverse proxies, or tweak the web server, you can modify the `RUN echo ...` block inside `Dockerfile.frontend`. The configuration is baked directly into the Docker image, so no external `nginx.conf` files are required in the repository.
