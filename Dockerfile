FROM node:16.15.1-alpine AS build
WORKDIR /usr/app
COPY package.json .
COPY typescript-functional-hangman-*.tgz . 
COPY typescript-mastodon-bot-framework-*.tgz .
COPY tsconfig.json .
RUN npm install --quiet
COPY ./src ./src
RUN npm run build

FROM node:16.15.1-alpine AS production
WORKDIR /usr/app
COPY --from=build ./usr/app/dist ./dist
COPY --from=build /usr/app/package.json .
COPY --from=build /usr/app/typescript-functional-hangman-*.tgz . 
COPY --from=build /usr/app/typescript-mastodon-bot-framework-*.tgz .
RUN npm install --production --quiet
CMD ["node", "./dist/index.js"]
