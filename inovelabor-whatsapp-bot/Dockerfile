FROM node:22-slim
ENV TZ=America/Sao_Paulo NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
COPY knowledge ./knowledge
VOLUME ["/app/data"]
CMD ["npx", "tsx", "src/index.ts"]
