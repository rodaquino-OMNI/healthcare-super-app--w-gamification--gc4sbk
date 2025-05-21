#!/usr/bin/env node

/**
 * API Documentation Generator
 * 
 * This script generates comprehensive API documentation from the GraphQL schema
 * and REST endpoints of the AUSTA SuperApp, outputting in OpenAPI format.
 * 
 * @version 2.0.0
 * @requires Node.js >= 18.0.0
 */

const fs = require('fs');
const path = require('path');
const { generate } = require('@graphql-codegen/cli'); // @graphql-codegen/cli@5.0.0
const yaml = require('js-yaml'); // js-yaml@4.1.0

// Paths configuration with improved error handling for refactored structure
const PATHS = {
  graphqlSchema: path.resolve(__dirname, '../../../api-gateway/src/graphql/schema.graphql'),
  restDefinitions: path.resolve(__dirname, '../../../api-gateway/src/config/rest-endpoints.json'),
  outputDir: path.resolve(__dirname, '../../../docs/api'),
  outputFile: 'openapi-spec.yaml'
};

// API version configuration
const API_VERSION = '2.0.0';
const API_VERSIONS = {
  current: API_VERSION,
  supported: ['1.0.0', '2.0.0']
};

// Journey-specific configuration
const JOURNEYS = {
  health: {
    name: 'Health Journey',
    description: 'APIs for health metrics, goals, and device connections',
    tag: 'health'
  },
  care: {
    name: 'Care Journey',
    description: 'APIs for appointments, providers, and telemedicine',
    tag: 'care'
  },
  plan: {
    name: 'Plan Journey',
    description: 'APIs for insurance plans, claims, and benefits',
    tag: 'plan'
  },
  gamification: {
    name: 'Gamification',
    description: 'Cross-journey APIs for achievements, rewards, and challenges',
    tag: 'gamification'
  },
  auth: {
    name: 'Authentication',
    description: 'APIs for user authentication and authorization',
    tag: 'auth'
  }
};

/**
 * Verifies that all required paths exist and are accessible
 * @returns {Promise<void>}
 */
async function verifyPaths() {
  try {
    console.log('Verifying path configuration...');
    
    // Check if GraphQL schema exists
    if (!fs.existsSync(PATHS.graphqlSchema)) {
      throw new Error(`GraphQL schema not found at ${PATHS.graphqlSchema}`);
    }
    
    // Check if REST definitions exist
    if (!fs.existsSync(PATHS.restDefinitions)) {
      console.warn(`REST definitions not found at ${PATHS.restDefinitions}. Only GraphQL documentation will be generated.`);
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(PATHS.outputDir)) {
      console.log(`Creating output directory at ${PATHS.outputDir}`);
      fs.mkdirSync(PATHS.outputDir, { recursive: true });
    }
    
    console.log('Path verification completed successfully.');
  } catch (error) {
    console.error('Path verification failed:', error);
    throw error;
  }
}

/**
 * Reads the GraphQL schema file
 * @returns {Promise<string>} The GraphQL schema as a string
 */
async function readGraphQLSchema() {
  try {
    console.log(`Reading GraphQL schema from ${PATHS.graphqlSchema}`);
    return fs.promises.readFile(PATHS.graphqlSchema, 'utf8');
  } catch (error) {
    console.error('Error reading GraphQL schema:', error);
    throw new Error(`Failed to read GraphQL schema: ${error.message}`);
  }
}

/**
 * Generates JSON schema from GraphQL schema using graphql-codegen
 * @param {string} schema - The GraphQL schema as a string
 * @returns {Promise<object>} The generated JSON schema
 */
async function generateJsonSchema(schema) {
  try {
    console.log('Generating JSON schema from GraphQL schema...');
    
    const tempOutputFile = path.join(PATHS.outputDir, 'temp-schema.json');
    
    // Ensure output directory exists
    if (!fs.existsSync(PATHS.outputDir)) {
      fs.mkdirSync(PATHS.outputDir, { recursive: true });
    }
    
    await generate({
      schema: {
        'schema.graphql': schema
      },
      generates: {
        [tempOutputFile]: {
          plugins: ['introspection']
        }
      },
      config: {
        noSchemaStitching: true
      }
    });
    
    const jsonSchema = JSON.parse(fs.readFileSync(tempOutputFile, 'utf8'));
    
    // Clean up temp file
    fs.unlinkSync(tempOutputFile);
    
    return jsonSchema;
  } catch (error) {
    console.error('Error generating JSON schema:', error);
    throw new Error(`Failed to generate JSON schema: ${error.message}`);
  }
}

/**
 * Reads the REST API endpoint definitions
 * @returns {Promise<object>} The REST API endpoint definitions
 */
async function readRestDefinitions() {
  try {
    console.log(`Reading REST API definitions from ${PATHS.restDefinitions}`);
    if (!fs.existsSync(PATHS.restDefinitions)) {
      console.warn(`REST definitions file not found. Returning empty definitions.`);
      return { endpoints: [] };
    }
    const data = await fs.promises.readFile(PATHS.restDefinitions, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading REST API definitions:', error);
    throw new Error(`Failed to read REST API definitions: ${error.message}`);
  }
}

/**
 * Determines the journey tag for a GraphQL field based on naming conventions
 * @param {string} fieldName - The name of the GraphQL field
 * @returns {string} The journey tag
 */
function determineJourneyTag(fieldName) {
  const fieldNameLower = fieldName.toLowerCase();
  
  if (fieldNameLower.includes('health') || fieldNameLower.includes('metric') || fieldNameLower.includes('device')) {
    return JOURNEYS.health.tag;
  } else if (fieldNameLower.includes('care') || fieldNameLower.includes('appointment') || fieldNameLower.includes('provider')) {
    return JOURNEYS.care.tag;
  } else if (fieldNameLower.includes('plan') || fieldNameLower.includes('claim') || fieldNameLower.includes('benefit')) {
    return JOURNEYS.plan.tag;
  } else if (fieldNameLower.includes('achievement') || fieldNameLower.includes('reward') || fieldNameLower.includes('challenge')) {
    return JOURNEYS.gamification.tag;
  } else if (fieldNameLower.includes('auth') || fieldNameLower.includes('login') || fieldNameLower.includes('user')) {
    return JOURNEYS.auth.tag;
  }
  
  return 'general';
}

/**
 * Converts GraphQL schema to OpenAPI paths with journey-specific grouping
 * @param {object} jsonSchema - The GraphQL schema in JSON format
 * @returns {object} OpenAPI paths derived from GraphQL schema
 */
function convertGraphQLToOpenAPI(jsonSchema) {
  console.log('Converting GraphQL schema to OpenAPI format with journey-specific grouping...');
  
  const paths = {};
  const components = {
    schemas: {}
  };
  
  // Extract types for components.schemas
  if (jsonSchema.__schema && jsonSchema.__schema.types) {
    jsonSchema.__schema.types.forEach(type => {
      // Skip introspection types and unions
      if (type.name.startsWith('__') || type.kind === 'UNION') {
        return;
      }
      
      if (type.kind === 'OBJECT' && !['Query', 'Mutation', 'Subscription'].includes(type.name)) {
        const properties = {};
        
        if (type.fields) {
          type.fields.forEach(field => {
            const propType = getOpenAPIType(field.type);
            properties[field.name] = {
              type: propType.type,
              ...(propType.format && { format: propType.format }),
              ...(propType.items && { items: propType.items }),
              description: field.description || `${field.name} field of ${type.name}`
            };
          });
        }
        
        components.schemas[type.name] = {
          type: 'object',
          properties
        };
      }
    });
  }
  
  // Create paths for queries
  const queryType = jsonSchema.__schema.types.find(type => type.name === 'Query');
  if (queryType && queryType.fields) {
    queryType.fields.forEach(field => {
      const operationId = `get${field.name.charAt(0).toUpperCase()}${field.name.slice(1)}`;
      const returnType = getReturnTypeName(field.type);
      const journeyTag = determineJourneyTag(field.name);
      
      paths[`/graphql/${field.name}`] = {
        get: {
          tags: [`GraphQL ${journeyTag.charAt(0).toUpperCase() + journeyTag.slice(1)} Queries`],
          summary: field.description || `Get ${field.name}`,
          operationId,
          parameters: field.args.map(arg => ({
            name: arg.name,
            in: 'query',
            description: arg.description || `${arg.name} parameter`,
            required: isNonNullType(arg.type),
            schema: getOpenAPIType(arg.type)
          })),
          responses: {
            '200': {
              description: `Successful ${field.name} query`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          [field.name]: {
                            $ref: `#/components/schemas/${returnType}`
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLError'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLError'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLError'
                  }
                }
              }
            }
          }
        }
      };
    });
  }
  
  // Create paths for mutations
  const mutationType = jsonSchema.__schema.types.find(type => type.name === 'Mutation');
  if (mutationType && mutationType.fields) {
    mutationType.fields.forEach(field => {
      const operationId = field.name;
      const returnType = getReturnTypeName(field.type);
      const journeyTag = determineJourneyTag(field.name);
      
      paths[`/graphql/${field.name}`] = {
        post: {
          tags: [`GraphQL ${journeyTag.charAt(0).toUpperCase() + journeyTag.slice(1)} Mutations`],
          summary: field.description || `Execute ${field.name} mutation`,
          operationId,
          requestBody: {
            description: `Input for ${field.name} mutation`,
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    variables: {
                      type: 'object',
                      properties: field.args.reduce((acc, arg) => {
                        acc[arg.name] = getOpenAPIType(arg.type);
                        return acc;
                      }, {})
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: `Successful ${field.name} mutation`,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          [field.name]: {
                            $ref: `#/components/schemas/${returnType}`
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLError'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLError'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQLError'
                  }
                }
              }
            }
          }
        }
      };
    });
  }
  
  // Add GraphQLError schema
  components.schemas['GraphQLError'] = {
    type: 'object',
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            locations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  line: {
                    type: 'integer',
                    description: 'Line number where the error occurred'
                  },
                  column: {
                    type: 'integer',
                    description: 'Column number where the error occurred'
                  }
                }
              }
            },
            path: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Path to the field that caused the error'
              }
            },
            extensions: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                classification: {
                  type: 'string',
                  description: 'Error classification'
                }
              }
            }
          }
        }
      }
    }
  };
  
  return { paths, components };
}

/**
 * Converts REST API definitions to OpenAPI paths with journey-specific grouping
 * @param {object} restDefinitions - The REST API endpoint definitions
 * @returns {object} OpenAPI paths for REST endpoints
 */
function convertRestToOpenAPI(restDefinitions) {
  console.log('Converting REST definitions to OpenAPI format with journey-specific grouping...');
  const paths = {};
  
  restDefinitions.endpoints.forEach(endpoint => {
    const pathKey = endpoint.path;
    
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }
    
    const method = endpoint.method.toLowerCase();
    const journeyTag = endpoint.journey || determineJourneyTag(endpoint.operationId || pathKey);
    
    paths[pathKey][method] = {
      tags: endpoint.tags || [`REST ${journeyTag.charAt(0).toUpperCase() + journeyTag.slice(1)} API`],
      summary: endpoint.summary || '',
      description: endpoint.description || '',
      operationId: endpoint.operationId || `${method}${pathKey.replace(/\//g, '_')}`,
      parameters: (endpoint.parameters || []).map(param => ({
        name: param.name,
        in: param.in,
        description: param.description || '',
        required: param.required || false,
        schema: param.schema
      })),
      responses: endpoint.responses || {
        '200': {
          description: 'Successful operation'
        },
        '400': {
          description: 'Bad request'
        },
        '401': {
          description: 'Unauthorized'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    };
    
    // Add request body if applicable
    if (endpoint.requestBody) {
      paths[pathKey][method].requestBody = endpoint.requestBody;
    }
  });
  
  return { paths };
}

/**
 * Merges GraphQL and REST API OpenAPI paths into a single specification
 * @param {object} graphqlOpenAPI - OpenAPI paths from GraphQL schema
 * @param {object} restOpenAPI - OpenAPI paths from REST definitions
 * @returns {object} Merged OpenAPI specification
 */
function mergeOpenAPISpecs(graphqlOpenAPI, restOpenAPI) {
  console.log('Merging GraphQL and REST API documentation...');
  
  const mergedPaths = {
    ...graphqlOpenAPI.paths,
    ...restOpenAPI.paths
  };
  
  // Create tags for each journey
  const tags = Object.values(JOURNEYS).map(journey => ({
    name: journey.name,
    description: journey.description
  }));
  
  // Add GraphQL and REST specific tags
  Object.values(JOURNEYS).forEach(journey => {
    tags.push(
      {
        name: `GraphQL ${journey.tag.charAt(0).toUpperCase() + journey.tag.slice(1)} Queries`,
        description: `GraphQL queries for the ${journey.name}`
      },
      {
        name: `GraphQL ${journey.tag.charAt(0).toUpperCase() + journey.tag.slice(1)} Mutations`,
        description: `GraphQL mutations for the ${journey.name}`
      },
      {
        name: `REST ${journey.tag.charAt(0).toUpperCase() + journey.tag.slice(1)} API`,
        description: `REST endpoints for the ${journey.name}`
      }
    );
  });
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'AUSTA SuperApp API',
      description: 'API documentation for the AUSTA SuperApp',
      version: API_VERSION,
      contact: {
        name: 'AUSTA Team',
        email: 'api@austa.com.br'
      }
    },
    servers: [
      {
        url: 'https://api.austa.com.br',
        description: 'Production API Server'
      },
      {
        url: 'https://staging-api.austa.com.br',
        description: 'Staging API Server'
      }
    ],
    tags,
    paths: mergedPaths,
    components: {
      schemas: {
        ...(graphqlOpenAPI.components && graphqlOpenAPI.components.schemas)
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    'x-api-versions': API_VERSIONS
  };
}

/**
 * Writes the OpenAPI specification to a YAML file
 * @param {object} openAPISpec - The OpenAPI specification
 * @returns {Promise<void>}
 */
async function writeOpenAPISpecToFile(openAPISpec) {
  try {
    if (!fs.existsSync(PATHS.outputDir)) {
      fs.mkdirSync(PATHS.outputDir, { recursive: true });
    }
    
    const outputPath = path.join(PATHS.outputDir, PATHS.outputFile);
    console.log(`Writing OpenAPI specification to ${outputPath}`);
    
    const yamlString = yaml.dump(openAPISpec, {
      indent: 2,
      lineWidth: 100,
      noRefs: true
    });
    
    await fs.promises.writeFile(outputPath, yamlString, 'utf8');
    
    console.log('OpenAPI specification generated successfully!');
  } catch (error) {
    console.error('Error writing OpenAPI specification to file:', error);
    throw new Error(`Failed to write OpenAPI specification: ${error.message}`);
  }
}

/**
 * Helper function to extract the return type name from a GraphQL type
 * @param {object} type - The GraphQL type object
 * @returns {string} The name of the return type
 */
function getReturnTypeName(type) {
  // Handle non-null wrapper
  if (type.kind === 'NON_NULL') {
    return getReturnTypeName(type.ofType);
  }
  
  // Handle list wrapper
  if (type.kind === 'LIST') {
    return getReturnTypeName(type.ofType);
  }
  
  // Return the type name
  return type.name || 'Object';
}

/**
 * Helper function to convert GraphQL types to OpenAPI types
 * @param {object} type - The GraphQL type object
 * @returns {object} The corresponding OpenAPI type
 */
function getOpenAPIType(type) {
  // Handle non-null wrapper
  if (type.kind === 'NON_NULL') {
    return getOpenAPIType(type.ofType);
  }
  
  // Handle list wrapper
  if (type.kind === 'LIST') {
    return {
      type: 'array',
      items: getOpenAPIType(type.ofType)
    };
  }
  
  // Handle scalar types
  switch(type.name) {
    case 'ID':
      return { type: 'string', format: 'id' };
    case 'String':
      return { type: 'string' };
    case 'Int':
      return { type: 'integer' };
    case 'Float':
      return { type: 'number', format: 'float' };
    case 'Boolean':
      return { type: 'boolean' };
    case 'DateTime':
      return { type: 'string', format: 'date-time' };
    case 'Date':
      return { type: 'string', format: 'date' };
    case 'JSON':
      return { type: 'object', additionalProperties: true };
    case 'URL':
      return { type: 'string', format: 'uri' };
    default:
      return { type: 'object', $ref: `#/components/schemas/${type.name}` };
  }
}

/**
 * Helper function to check if a GraphQL type is non-null
 * @param {object} type - The GraphQL type object
 * @returns {boolean} Whether the type is non-null
 */
function isNonNullType(type) {
  return type.kind === 'NON_NULL';
}

/**
 * Generates API documentation for the AUSTA SuperApp
 * 
 * This function coordinates the process of generating comprehensive API documentation
 * by reading the GraphQL schema and REST API definitions, converting them to OpenAPI format,
 * merging them, and writing the result to a YAML file.
 */
async function generateApiDocs() {
  try {
    console.log('Starting API documentation generation...');
    console.log(`Using Node.js ${process.version}`);
    console.log(`API Version: ${API_VERSION}`);
    
    // Verify paths
    await verifyPaths();
    
    // Read GraphQL schema
    const graphqlSchema = await readGraphQLSchema();
    
    // Generate JSON schema from GraphQL schema
    const jsonSchema = await generateJsonSchema(graphqlSchema);
    
    // Read REST API endpoint definitions
    const restDefinitions = await readRestDefinitions();
    
    // Convert GraphQL schema to OpenAPI paths
    const graphqlOpenAPI = convertGraphQLToOpenAPI(jsonSchema);
    
    // Convert REST API definitions to OpenAPI paths
    const restOpenAPI = convertRestToOpenAPI(restDefinitions);
    
    // Merge GraphQL and REST API OpenAPI paths
    const openAPISpec = mergeOpenAPISpecs(graphqlOpenAPI, restOpenAPI);
    
    // Write the OpenAPI specification to a YAML file
    await writeOpenAPISpecToFile(openAPISpec);
    
    console.log('API documentation generation completed successfully!');
  } catch (error) {
    console.error('API documentation generation failed:', error);
    process.exit(1);
  }
}

// Execute the main function
generateApiDocs();