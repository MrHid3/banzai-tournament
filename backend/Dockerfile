FROM node:22
WORKDIR /app
RUN apt-get update && apt-get install -y netcat-openbsd
COPY package.json ./
RUN npm install
COPY ./src .
COPY ./scripts .
ENV PORT=3000
EXPOSE 3000
CMD ["nodemon", "src/app.js"]