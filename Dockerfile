# syntax=docker/dockerfile:1

# --- Build: install all dependencies and compile the Tailwind stylesheet.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime: production dependencies only, no source bind mounts (SKPL-NF-05.1).
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=44100 \
    UPLOAD_DIR=/data/uploads
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/app ./app
COPY --from=build /app/db ./db
COPY --from=build /app/public ./public
COPY --from=build /app/server.ts /app/remix.json /app/tsconfig.json ./
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 44100
# Migrations are an explicit deployment step (SKPL-NF-05.2), not run on boot:
#   docker compose -f docker-compose.prod.yml run --rm app npx remix db migrate
CMD ["node", "--import", "remix/node-tsx", "server.ts"]
