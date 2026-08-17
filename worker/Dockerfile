FROM node:22-alpine
WORKDIR /app
COPY worker/package.json ./package.json
RUN npm install
COPY worker ./worker
WORKDIR /app/worker
CMD ["npm","start"]
