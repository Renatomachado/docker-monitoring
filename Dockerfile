FROM node:10-alpine

RUN mkdir -p /app

WORKDIR /app
ADD . .
RUN npm i
CMD ["node", "index.js"]
