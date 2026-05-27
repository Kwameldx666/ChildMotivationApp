# syntax=docker/dockerfile:1

ARG NEXT_PUBLIC_API_URL=http://161.35.169.189:8081
ARG INTERNAL_API_URL=http://gateway-service:8080

FROM node:22-alpine AS base
ARG NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
WORKDIR /app

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
COPY Frontend/package.json Frontend/pnpm-lock.yaml Frontend/pnpm-workspace.yaml ./
# pnpm 9.x reads onlyBuiltDependencies from package.json["pnpm"] field.
# pnpm-workspace.yaml is also copied so both pnpm 9 and 11 are covered.
# PNPM_NO_FROZEN_LOCKFILE ensures the install never blocks on lockfile drift.
ENV PNPM_NO_FROZEN_LOCKFILE=true
RUN pnpm install --no-frozen-lockfile

FROM base AS build
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY Frontend/ .
RUN pnpm build

FROM node:22-alpine AS runner
ARG NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3000

CMD ["node","node_modules/next/dist/bin/next","start","-p","3000"]
