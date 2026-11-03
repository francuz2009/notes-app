
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json
USER app
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]