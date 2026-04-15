FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM heroiclabs/nakama:3.22.0
COPY --from=builder /app/build /nakama/data/modules