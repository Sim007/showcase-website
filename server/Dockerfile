FROM node:20-alpine
WORKDIR /app

COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev

COPY server ./server
COPY content ./content

WORKDIR /app/server
EXPOSE 4000
CMD ["node", "src/index.js"]
