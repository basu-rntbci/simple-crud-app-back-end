# =============================================================================
# Backend Dockerfile — Multi-stage build for the Express/Node.js API
#
# WHY multi-stage?
#   Stage 1 (builder) installs all dependencies including devDependencies so
#   we can run any compile/lint steps. Stage 2 (production) copies only the
#   compiled output and production-only node_modules, keeping the final image
#   as small as possible (fewer packages = smaller attack surface).
#
# HOW TO BUILD:
#   docker build -t simple-crud-backend .
#
# HOW TO RUN LOCALLY:
#   docker run -p 3000:3000 --env-file .env simple-crud-backend
# =============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# node:22-alpine uses Alpine Linux — a minimal OS (~5 MB) instead of the full
# Debian/Ubuntu image (~100 MB). The "22" pins us to Node 22 LTS so we get
# long-term security patches without surprise version upgrades on rebuild.
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests BEFORE the source files.
# Docker builds layer by layer and caches each one. Because package.json
# changes much less often than source code, this layer is reused on most
# rebuilds — meaning npm install only re-runs when dependencies actually change.
COPY package*.json ./

# npm ci ("clean install") is preferred over npm install in CI/Docker because:
#   1. It reads package-lock.json exactly — fully reproducible builds.
#   2. It deletes node_modules first, avoiding stale dependency ghosts.
#   3. --include=dev brings in devDependencies needed for any build tools.
RUN npm ci --include=dev

# Copy all source files after installing dependencies so the install cache
# is still valid even when source code changes.
COPY . .


# ── Stage 2: Production ───────────────────────────────────────────────────────
# We start fresh from the same base image. Nothing from Stage 1 carries over
# except what we explicitly COPY --from=builder, so test tools, devDependencies,
# and any build artifacts we don't need are automatically excluded.
FROM node:22-alpine AS production

# Labels make the image self-documenting in registries like ECR/Docker Hub.
LABEL maintainer="simple-crud-app"
LABEL description="Simple CRUD API — Express + MongoDB"

# Create a dedicated OS-level user (appuser) inside a group (appgroup).
# Containers should NEVER run as root. If the application is ever exploited,
# a non-root user limits what the attacker can do inside the container.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the package manifests so we can install production deps cleanly.
COPY package*.json ./

# --omit=dev skips devDependencies (jest, supertest, nodemon, etc.).
# npm cache clean --force removes the npm cache after install to shrink the
# image layer — once installed, the cache is never needed again at runtime.
RUN npm ci --omit=dev && npm cache clean --force

# Copy just the application source from the builder stage (not all of /app,
# which would include devDependencies node_modules we just excluded above).
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js

# Switch to the non-root user. All subsequent RUN, CMD, and ENTRYPOINT
# instructions will execute as appuser, not root.
USER appuser

# EXPOSE documents which port the process listens on. It does NOT publish
# the port — that's done at runtime with -p 3000:3000 or in Kubernetes
# via the Service spec. It's metadata for developers and tooling.
EXPOSE 3000

# NODE_ENV=production tells Express to:
#   - Disable verbose error stack traces in HTTP responses (security)
#   - Enable response caching optimisations
#   - Skip morgan request logging (we rely on structured logs in prod)
ENV NODE_ENV=production

# The HEALTHCHECK instruction tells Docker (and Kubernetes via liveness probes)
# how to test if the container is healthy:
#   --interval=30s  — check every 30 seconds
#   --timeout=10s   — fail the check if no response within 10 s
#   --start-period=15s — give the app 15 s to start before the first check
#   --retries=3     — mark unhealthy only after 3 consecutive failures
#
# The command uses node (not curl) so we don't need to install curl in the
# Alpine image. It opens an HTTP connection to /health and exits 0 (healthy)
# if the status code is 200, or 1 (unhealthy) otherwise.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "\
    require('http').get('http://localhost:3000/health', r => \
      process.exit(r.statusCode === 200 ? 0 : 1) \
    ).on('error', () => process.exit(1))"

# CMD defines the default command when the container starts.
# We use the exec form (JSON array) instead of shell form ("node server.js")
# so the process runs as PID 1 and receives OS signals (SIGTERM, SIGINT)
# directly — critical for graceful shutdown in Kubernetes.
CMD ["node", "server.js"]
