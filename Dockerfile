FROM node:18-alpine
WORKDIR /app
COPY ./flux-cloud/package*.json ./
RUN npm install --production
COPY ./flux-cloud/server.js ./server.js
COPY ./flux-cloud/public/ ./public/
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "server.js"]
