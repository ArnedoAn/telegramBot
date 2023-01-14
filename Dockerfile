FROM node:lts-alpine
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
ENV TTOKEN="5913355394:AAHsMG4wXH3c6l5aehdRf_GLiQ7rUsIe48M"
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install
COPY . .
EXPOSE 5000
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
