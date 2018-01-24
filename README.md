# Bodhi application logic in GraphQL + neDB

## Get Started
1. `git clone https://github.com/bodhiproject/bodhi-graphql.git`

2. `cd bodhi-graphql`

3. `npm install`

4. start bodhi-graphql at 5555

`node src/index.js`

play with graphiql on `localhost:5555/graphiql`

## Package & Release
1. `npm install -g pkg`

2. `npm run build`

3. In the dir with package.json, run

`pkg . --out-path bin`

3. all executables are in `bin\`
