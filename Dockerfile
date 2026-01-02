FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install 

COPY . .

RUN npx tailwindcss -i ./static/styles/styles.css -o ./static/tailwind/output.css

EXPOSE 3000

CMD ["node", "src/server.js"]
