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
RUN corepack enable
COPY Frontend/package.json Frontend/pnpm-lock.yaml ./
# pnpm 11 requires explicit approval for packages that run build scripts.
# onlyBuiltDependencies in package.json handles this, but we also set the env
# var as a fallback so the build never blocks waiting for interactive input.
ENV PNPM_NO_FROZEN_LOCKFILE=true
RUN pnpm install --no-frozen-lockfile

FROM base AS build
RUN corepack enable
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

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3000

CMD ["node","node_modules/next/dist/bin/next","start","-p","3000"]