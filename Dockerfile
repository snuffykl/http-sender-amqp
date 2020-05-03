FROM node:10-alpine
ENV NODE_ENV=production
WORKDIR /http-sender-amqp
ADD ./package.json ./package.json
ADD ./package-lock.json ./package-lock.json
RUN npm ci --production
ADD ./app ./app
CMD ["node", "./app/http/index.js"]
