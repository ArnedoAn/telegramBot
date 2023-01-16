FROM node:latest AS builder
ENV PORT=8000
ENV TELEGRAM_TOKEN=5913355394:AAHsMG4wXH3c6l5aehdRf_GLiQ7rUsIe48M
ENV DATABASE_URL=file:./dev.db
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:latest AS server
ENV PORT=8000
ENV TELEGRAM_TOKEN=5913355394:AAHsMG4wXH3c6l5aehdRf_GLiQ7rUsIe48M
ENV DATABASE_URL=file:./dev.db
WORKDIR /app
COPY package* ./
RUN npm install --omit=dev
COPY --from=builder ./app/src ./src
COPY --from=builder ./app/dist ./dist
EXPOSE 8000
CMD ["npm", "start"]