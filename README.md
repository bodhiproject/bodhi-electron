# Bodhi application logic in GraphQL + neDB

## Get Started
1. `git clone https://github.com/bodhiproject/bodhi-graphql.git`

2. `cd bodhi-graphql`

3. `npm install`

4. Download corresponding qtum from https://github.com/qtumproject/qtum/releases, unzip it,change the folder name to `mac` or `win32` or `win64` or `linux64` or `linux32`, and put it inside `./qtum` folder, if `qtum` folder doesn't exist, create one. 

5. open `package.json` and change `node src/index.js --qtumpath=./qtum/mac/bin --dev` the qtumpath to your corresponding qtumpath like `node src/index.js --qtumpath=./qtum/win64/bin --dev`.

6. start bodhi-graphql at 5555

`npm start`

play with graphiql on `localhost:5555/graphiql`

## Package & Release
1. `npm install -g pkg`

2. `npm run pkg:mac` or `npm run pkg:win64`
