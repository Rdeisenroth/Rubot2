# Rubot2
[![Build](https://github.com/Rdeisenroth/Rubot2/actions/workflows/build.yml/badge.svg)](https://github.com/Rdeisenroth/Rubot2/actions/workflows/build.yml)
![GitHub top language](https://img.shields.io/github/languages/top/Rdeisenroth/Rubot2?logo=Github)
![GitHub repo size](https://img.shields.io/github/repo-size/Rdeisenroth/Rubot2?color=success&logo=Github)
![Commands](https://img.shields.io/badge/Commands-77-orange?logo=Discord&logoColor=ffffff)

a general Purpose Discord Bot
# Setup
- Install Mongodb and add a new user and give it acess to the schema you want to use
    - Hint: A strong password can be generated with `openssl rand -base64 <length>` and converted for the coonnection string with `php -r "echo urlencode(\"<password>\");"`
- install the Dependencies with `npm install`
- Create a config.json File and Fill it according to the Json Schema
- run `npm start` to compile and run the Bot

# Deployment
- Run `npm build` once to compile to the dist directory on the target device
- Start the `index.js` in the dist directory