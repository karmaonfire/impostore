# Builds the React client, then ships it as static files served by the
# Node/Express + Socket.IO backend — a single deployable web service.

FROM node:20-alpine AS client-build
WORKDIR /app
COPY shared ./shared
COPY client/package.json client/package-lock.json* ./client/
RUN npm --prefix client install
COPY client ./client
RUN npm --prefix client run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY shared ./shared
COPY server/package.json server/package-lock.json* ./server/
RUN npm --prefix server install --omit=dev
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001
CMD ["npm", "--prefix", "server", "start"]
