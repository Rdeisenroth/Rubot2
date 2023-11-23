# Rubot2
[![Build](https://github.com/Rdeisenroth/Rubot2/actions/workflows/docker-img.yml/badge.svg)](https://github.com/Rdeisenroth/Rubot2/actions/workflows/docker-img.yml)
![GitHub top language](https://img.shields.io/github/languages/top/Rdeisenroth/Rubot2?logo=Github)
![GitHub repo size](https://img.shields.io/github/repo-size/Rdeisenroth/Rubot2?color=success&logo=Github)
![Commands](https://img.shields.io/badge/Commands-77-orange?logo=Discord&logoColor=ffffff)

A general Purpose Discord Bot.

# Development Setup
- Clone the Repository
- Either use the docker compose file to start a mongodb instance or install mongodb locally
  - To use the docker compose file run `docker-compose -f docker-compose.development.yml up -d`
- Setup a `.env` File 
  - `TOKEN` is the Discord Bot Token. To see how to create a Discord Bot see [Setup.md](Setup.md)
  - `OWNER_ID` is the Discord ID of the Bot Owner. To get your Discord ID enable Developer Mode in the Discord Settings and right click on your name in the User List.
  - `CLIENT_ID` is the Discord ID of the Bot. To get the ID go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your application. The ID is displayed under the name of the application. Alternatively enable Developer Mode in the Discord Settings and right click on the Bot in the User List to copy the ID.
  - `MONGODB_USER` is the Username for the Mongodb Database. If you use the docker compose development file you can freely choose the value. If you use a local instance of mongodb you have to create a new user and give it access to the database you want to use.
  - `MONGODB_PASSWORD` is the Password for the Mongodb Database. If you use the docker compose development file you can freely choose the value. If you use a local instance of mongodb you have to create a new user and give it access to the database you want to use.
  - `MONGODB_DBNAME` is the Name of the Mongodb Database. If you use the docker compose development file you can freely choose the value. If you use a local instance of mongodb you have to create a new user and give it access to the database you want to use.
  - `MONGODB_CONNECTION_URL` is the Connection String for the Mongodb Database. The connection string should look like this: `mongodb://<user>:<password>@<host>:<port>/<database>?authSource=admin` make sure to replace the values with the ones you chose above, host and port should be `localhost` or `127.0.0.1` and `27017` respectively.
- Install the Dependencies with `npm install`
- Run `npm start` to compile and run the Bot in development mode

## Setup for manual Testing
See [Setup.md](Setup.md).

# Deployment
- Run `npm build` once to compile to the dist directory on the target device
- Start the `index.js` in the dist directory