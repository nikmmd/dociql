const { graphqlSync, buildSchema, getIntrospectionQuery, buildClientSchema } = require('graphql')
const fs = require('fs');
const fetch = require('sync-fetch')
const converter = require('graphql-2-json-schema');

module.exports = function (graphUrl, authHeader) { 
    if (graphUrl.includes("file://")) {
        return fetchSchemaFromFile(graphUrl);
    } else {
        return fetchSchemaFromUrl(graphUrl, authHeader);
    }
    

}

function fetchSchemaFromFile(graphUrl) {
  const filePath = graphUrl.replace("file://", "");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let graphQLSchema;

  try {
    graphQLSchema = buildSchema(fileContent);
  } catch (e) {
    console.error(`Encountered an error parsing the schema file. Is ${filePath} in GraphQL SDL format?`);
    throw e;
  }
  
  const introspection = graphqlSync(graphQLSchema, getIntrospectionQuery()).data;

  const jsonSchema = converter.fromIntrospectionQuery(introspection);

  return {
    jsonSchema,
    graphQLSchema
  }
}

function fetchSchemaFromUrl(graphUrl, authHeader) {
    const requestBody = {
        operationName: "IntrospectionQuery",
        query: getIntrospectionQuery()
    };

    const headers = authHeader ? Object.fromEntries([authHeader.split(":")]) : {};
    
    const response = fetch(graphUrl, {
      method: 'post',
      body: JSON.stringify(requestBody),
      headers: {...{'Content-Type': 'application/json'}, ...headers}
    }).json();


    const graphQLSchema = buildClientSchema(response.data);
    const jsonSchema = converter.fromIntrospectionQuery(response.data);

    return {
        jsonSchema,
        graphQLSchema
    }
}
