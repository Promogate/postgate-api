FROM node:20-alpine AS base

FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /postgate

COPY yarn.lock* ./

RUN yarn --frozen-lockfile

FROM base AS builder
WORKDIR /postgate
COPY --from=deps /postgate/node_modules ./node_modules
COPY . .

RUN yarn run prisma generate && yarn run build

CMD node src/server.js