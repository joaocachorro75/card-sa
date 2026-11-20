# Build stage - compila o frontend React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instala dependências de produção + tsx + wget para healthcheck
RUN apk add --no-cache wget
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm install tsx typescript

# Copia o build do frontend
COPY --from=builder /app/dist ./dist

# Copia o servidor backend e config
COPY server.ts ./
COPY mockPool.ts ./
COPY tsconfig.json ./

# Cria pasta de uploads para imagens
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD sh -c 'wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-80}/health" || exit 1'

CMD ["npx", "tsx", "server.ts"]
