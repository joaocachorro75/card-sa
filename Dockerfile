# Build stage - compila o frontend React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instala dependências de produção + tsx para rodar TypeScript
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx typescript

# Copia o build do frontend
COPY --from=builder /app/dist ./dist

# Copia o servidor backend e config
COPY server.ts ./
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npx", "tsx", "server.ts"]
