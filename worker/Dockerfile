FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
COPY worker/package.json ./worker/package.json
COPY worker/src ./worker/src
RUN npx prisma generate
CMD ["node", "--import", "tsx", "worker/src/index.ts"]
