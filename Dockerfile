FROM node:14-alpine
ENV NODE_ENV=production
WORKDIR /http-sender-amqp
ADD ./package.json ./package.json
ADD ./package-lock.json ./package-lock.json
RUN npm ci --production
ADD ./app ./app
USER node
CMD ["node", "./app/http/index.js"]
