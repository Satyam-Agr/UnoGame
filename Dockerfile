FROM node

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

WORKDIR /app

COPY . .

ENTRYPOINT [ "node" , "index.js" ]