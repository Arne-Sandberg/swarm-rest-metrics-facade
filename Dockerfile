FROM node:10
LABEL maintainer="Tom Saleeba"
ENV listenPort 3000
EXPOSE $listenPort
RUN mkdir /app
WORKDIR /app
ADD index.js package.json yarn.lock ./
RUN yarn
CMD ["node", "index.js"]

