FROM node:16.15.1-alpine AS build

WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY ./src ./src
RUN npm run build

FROM node:16.15.1-alpine
COPY --from=build /usr/app/dist /usr/app/dist
CMD ["node", "./dist/bot.js"]
