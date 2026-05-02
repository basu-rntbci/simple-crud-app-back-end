# =============================================================================
# Frontend Dockerfile — Multi-stage build for the Angular 21 SPA
#
# WHY multi-stage?
#   Stage 1 (builder) uses a full Node.js image to compile TypeScript,
#   bundle JavaScript, and generate optimised static files via `ng build`.
#   Stage 2 (production) uses a tiny Nginx image to serve those files.
#   The final image has NO Node.js, no Angular CLI, no TypeScript compiler —
#   just Nginx and the compiled HTML/JS/CSS. This keeps the image small
#   (~25 MB vs ~400 MB for the builder stage).
#
# HOW TO BUILD:
#   docker build -t simple-crud-frontend .
#
# HOW TO RUN LOCALLY:
#   docker run -p 8080:80 simple-crud-frontend
#   Then open http://localhost:8080
# =============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Node 22 Alpine provides npm and the Node.js runtime needed to run the
# Angular build toolchain. Alpine keeps this intermediate stage lean too.
FROM node:22-alpine AS builder

# Install git — some npm packages (e.g. those pointing to GitHub URLs in
# package.json) require git to be present during npm install.
RUN apk add --no-cache git

WORKDIR /app

# Copy only package manifests first so Docker can cache the npm install layer.
# If package.json hasn't changed, this entire layer is reused on the next build,
# saving several minutes on the Angular CLI + Material install.
COPY package*.json ./

# npm ci produces a deterministic install identical to what CI machines use.
# We install ALL dependencies here (including devDependencies) because the
# Angular CLI (@angular/build) is a devDependency but is required to build.
RUN npm ci

# Copy all Angular source code after installing dependencies.
COPY . .

# Build the Angular app in production mode.
# --configuration production enables:
#   - Ahead-of-Time (AOT) compilation — templates compiled at build time, not runtime
#   - Tree-shaking — removes dead code to minimise bundle size
#   - Output hashing — appends content hash to filenames for cache busting
#   - Minification — compresses JS/CSS
# Output goes to dist/frontend/browser/ (Angular 17+ output structure)
RUN npm run build -- --configuration production


# ── Stage 2: Production ───────────────────────────────────────────────────────
# nginx:alpine is ~25 MB. It's the standard choice for serving static files
# in production containers. The 'alpine' variant excludes debug tools and
# reduces the attack surface.
FROM nginx:alpine AS production

# Remove the default Nginx welcome page and configuration so they can't
# accidentally serve content or reveal version info.
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config which handles:
#   - SPA routing (try_files fallback to index.html)
#   - Security headers
#   - Aggressive caching for hashed assets
#   - Gzip compression
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the compiled Angular output from the builder stage.
# Angular 17+ places browser output in dist/<project>/browser/.
# Everything else from the builder (node_modules, TypeScript source, etc.)
# is left behind — it never enters this final image.
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# EXPOSE 80 documents that the container serves HTTP on port 80.
# The Kubernetes Service and ALB Ingress will forward traffic here.
EXPOSE 80

# Nginx starts automatically when the container runs. We use the exec form
# so Nginx is PID 1 and receives OS signals directly (for graceful shutdown).
# 'daemon off' keeps Nginx in the foreground — containers exit when PID 1 exits,
# so we need the main process to stay in the foreground.
CMD ["nginx", "-g", "daemon off;"]
