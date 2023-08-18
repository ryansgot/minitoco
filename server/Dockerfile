FROM node:18.15.0

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node . .
RUN chown -R node:node /home/node
USER node
ARG NODE_ENV
# Do not install any dev-only dependencies in production
RUN if [ "$NODE_ENV" = "development" ]; then npm install; else npm install --only=production; fi
COPY --chown=node:node . .
RUN npx prisma generate
CMD [ "npm", "start" ]
