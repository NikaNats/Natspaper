# Base stage for building static files using Node 24 Alpine (Zero CVEs)
FROM node:24-alpine AS base
WORKDIR /app

# Disable Husky in Docker builds
ENV HUSKY=0

# Install git for remark-modified-time plugin and enable corepack.
# pnpm version is NOT pinned here: corepack reads the `packageManager`
# field from package.json (single source of truth) at invocation time,
# keeping Docker, CI, CD and local dev on exactly the same version.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apk add --no-cache git && \
    corepack enable

# IMPORTANT: COPY pnpm-workspace.yaml so pnpm v11 reads allowBuilds settings!
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build:prod

# Runtime stage: Nginx with RFC 9111 Caching configuration
FROM nginx:alpine-slim AS runtime

COPY --from=base /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions for non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user for security best practices
USER nginx

EXPOSE 80