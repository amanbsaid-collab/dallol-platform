FROM node:24-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

CMD ["node", "--import", "tsx", "src/index.ts"]
