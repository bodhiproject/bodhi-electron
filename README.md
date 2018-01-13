# Bodhi application logic in GraphQL + MongoDB

## Get Started
1. `git clone https://github.com/bodhiproject/bodhi-graphql.git`

2. `cd bodhi-graphql`

3. `npm install`

4. start mongodb at 27017

`docker run -d -p 27017:27017 -v testmongodata:/data/db mongo`

5. start bodhi-graphql at 5555

`node src/index.js`

play with graphiql on `localhost:5555/graphiql`

6. In the left editing column, run a query such as

   ``` 
   query{
     allOracles {
         address,
         topicAddress,
         status,
         token,
         name,
         options,
      optionIdxs,
         amounts,
         resultIdx,
         blockNum,
         endBlock
       },
   }
   ```

   If qtumd is synced, the query should return Oracle objects on the right column; otherwise an empty array.
