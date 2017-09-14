//Swagger Documentation !
module.exports = {
  find: {
    parameters: [
      {
        description: 'Number of results to return',
        in: 'query',
        name: '$limit',
        type: 'integer'
      },
      {
        description: 'Number of results to skip',
        in: 'query',
        name: '$skip',
        type: 'integer'
      },
      {
        description: 'Property to sort results',
        in: 'query',
        name: '$sort',
        type: 'string'
      },
      {
        description: 'Property to query results',
        in: 'query',
        name: '$search',
        type: 'string'
      },
      {
        description: 'Property to query results ! you can use any expression like integer string boolean',
        in: 'query',
        name: '$contains',
        type: 'object',
        properties: {
          fildname: {
            type: 'string'
          },
          expression: {
            type: 'string'
          }
        }
      }
    ]
  },
  get: {
    parameters: {}
  }
};
