# Frontend Next.js (standalone) — EasyPanel / Docker
# Variables NEXT_PUBLIC_* se inyectan en el BUILD (quedan en el bundle).
# API_URL es de servidor: puede ir en build y/o runtime en EasyPanel.

# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Build-time (EasyPanel → Build Args / Environment at build)
ARG API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_KLIPY_API_KEY

ENV API_URL=$API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_PUBLIC_KLIPY_API_KEY=$NEXT_PUBLIC_KLIPY_API_KEY \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DOCKER_BUILD=1

RUN npm run build

# ── Stage 3: runtime ───────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# standalone: server.js + node_modules mínimos
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
