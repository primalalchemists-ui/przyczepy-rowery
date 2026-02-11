# syntax=docker/dockerfile:1

FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- deps ----
FROM base AS deps
# pnpm bez corepack download w locie
RUN npm i -g pnpm@10.29.3

COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

# ---- builder ----
FROM base AS builder
RUN npm i -g pnpm@10.29.3

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- runner ----
FROM base AS runner
ENV NEXT_TELEMETRY_DISABLED=1

RUN useradd -m -u 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
