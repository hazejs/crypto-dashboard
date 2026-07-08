# Stage 1: install everything, typecheck and build the frontend
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci
COPY shared ./shared
COPY server ./server
COPY client ./client
RUN npm run build -w client

# Stage 2: production runtime — TS runs natively on Node 24 (type stripping),
# so the server ships as source; no dev deps, no build output.
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --omit=dev
COPY shared ./shared
COPY server/src ./server/src
COPY --from=build /app/client/dist ./client/dist
EXPOSE 4000
CMD ["node", "server/src/index.ts"]
