FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production
RUN mkdir -p data public
RUN if [ -f index.html ] && [ ! -f public/index.html ]; then mv index.html public/index.html; fi
EXPOSE 3000
CMD ["node", "server.js"]
