# Build
FROM node:16-alpine as build
COPY . /app
WORKDIR /app

ENV NODE_ENV production
RUN yarn install
RUN yarn build

# Serve
FROM node:16-alpine

COPY --from=build /app /

ENV NODE_ENV production
CMD ["yarn", "keystone-next", "start"]
