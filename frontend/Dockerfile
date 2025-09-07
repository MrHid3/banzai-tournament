FROM node:22
WORKDIR /app
COPY package.json ./
RUN npm install
COPY ./src .
ENV PORT=4000
EXPOSE 4000
CMD ["node", "app.js"]
