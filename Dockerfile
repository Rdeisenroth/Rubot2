FROM node:latest AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# EXPOSE 3001

# Run the app
CMD [ "node", "dist/index.js" ]