# Build stage - Frontend React
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Build stage - Backend TypeScript
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.ts tsconfig.json ./
RUN npx tsc server.ts --outDir dist --module nodenext --moduleResolution nodenext --target es2022 --esModuleInterop --skipLibCheck 2>/dev/null || \
    npx tsx build --compile server.ts 2>/dev/null || \
    cp server.ts dist/server.ts

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia o build do frontend
COPY --from=frontend-builder /app/dist ./dist

# Copia arquivos necessários para tsx
COPY --from=backend-builder /app/node_modules ./node_modules
COPY server.ts tsconfig.json ./

# Instala tsx para rodar TypeScript
RUN npm install tsx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npx", "tsx", "server.ts"]
