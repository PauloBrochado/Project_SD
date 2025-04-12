FROM node:18

WORKDIR /app
COPY . /app/
RUN npm install

WORKDIR /app/rp
CMD ["node", "server.js"]
