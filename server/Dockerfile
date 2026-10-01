FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN chmod +x node_modules/.bin/tsc

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]