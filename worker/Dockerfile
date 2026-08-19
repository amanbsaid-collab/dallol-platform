FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY worker/package.json ./worker/package.json
RUN cd worker && npm install

COPY worker/src ./worker/src

RUN npx prisma generate

WORKDIR /app/worker

CMD ["node", "--import", "tsx", "src/index.ts"]
