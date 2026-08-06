FROM node:20-alpine
WORKDIR /app

COPY client/package.json ./client/package.json
RUN cd client && npm install

COPY client ./client

WORKDIR /app/client
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
