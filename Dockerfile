# Base stage for building static files using Node 24 Alpine (Zero CVEs)
FROM node:24-alpine AS base
WORKDIR /app

# Install git for remark-modified-time plugin and corepack for pnpm
RUN apk add --no-cache git && \
    corepack enable && \
    corepack prepare pnpm@10.20.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build:prod

# Runtime stage: High-performance, lightweight Nginx web server
FROM nginx:alpine-slim AS runtime

# Copy static HTML files
COPY --from=base /app/dist /usr/share/nginx/html

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