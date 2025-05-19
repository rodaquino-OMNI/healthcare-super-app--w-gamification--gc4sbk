#!/usr/bin/env node

/**
 * API Documentation Generator
 * 
 * This script generates comprehensive API documentation from the GraphQL schema
 * and REST endpoints of the AUSTA SuperApp, outputting in OpenAPI format.
 * 
 * @version 2.0.0
 * @requires Node.js ≥18.0.0
 */

const fs = require('fs');
const path = require('path');
const { generate } = require('@graphql-codegen/cli'); // @graphql-codegen/cli@5.0.0
const yaml = require('js-yaml'); // js-yaml@4.1.0

// Journey types for grouping APIs
const JOURNEY_TYPES = {
  HEALTH: 'health',
  CARE: 'care',
  PLAN: 'plan',
  GAMIFICATION: 'gamification',
  COMMON: 'common'
};

// Paths configuration with fallbacks for better error handling
const PATHS = {
  // Main schema paths
  graphqlSchema: path.resolve(__dirname, '../../../backend/api-gateway/src/graphql/schema.graphql'),
  restDefinitions: path.resolve(__dirname, '../../../backend/api-gateway/src/config/rest-endpoints.json'),
  outputDir: path.resolve(__dirname, '../../../docs/api'),
  outputFile: 'openapi-spec.yaml',
  
  // Journey-specific schema paths
  journeySchemas: {
    [JOURNEY_TYPES.HEALTH]: path.resolve(__dirname, '../../../backend/health-service/src/graphql/schema.graphql'),
    [JOURNEY_TYPES.CARE]: path.resolve(__dirname, '../../../backend/care-service/src/graphql/schema.graphql'),
    [JOURNEY_TYPES.PLAN]: path.resolve(__dirname, '../../../backend/plan-service/src/graphql/schema.graphql'),
    [JOURNEY_TYPES.GAMIFICATION]: path.resolve(__dirname, '../../../backend/gamification-engine/src/graphql/schema.graphql')
  }
};

/**
 * Safely resolves a file path and checks if it exists
 * @param {string} filePath - The path to resolve
 * @param {string} fallbackPath - Optional fallback path if the primary doesn't exist
 * @param {boolean} required - Whether the file is required (throws if not found)
 * @returns {string|null} The resolved path or null if not found and not required
 */
function safeResolvePath(filePath, fallbackPath = null, required = false) {
  try {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      console.warn(`Primary path ${filePath} not found, using fallback ${fallbackPath}`);
      return fallbackPath;
    }
    
    if (required) {
      throw new Error(`Required file not found at ${filePath}${fallbackPath ? ` or ${fallbackPath}` : ''}`);
    }
    
    console.warn(`Optional file not found at ${filePath}`);
    return null;
  } catch (error) {
    if (error.code !== 'ENOENT' || required) {
      throw error;
    }
    console.warn(`Error checking path ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Reads the GraphQL schema files, including journey-specific schemas if available
 * @returns {Promise<{mainSchema: string, journeySchemas: Object<string, string>}>} The GraphQL schemas
 */
async function readGraphQLSchemas() {
  try {
    console.log('Reading GraphQL schemas...');
    
    // Resolve the main schema path with fallback
    const mainSchemaPath = safeResolvePath(
      PATHS.graphqlSchema,
      path.resolve(__dirname, '../../../api/schema.graphql'),
      true
    );
    
    console.log(`Reading main GraphQL schema from ${mainSchemaPath}`);
    const mainSchema = await fs.promises.readFile(mainSchemaPath, 'utf8');
    
    // Read journey-specific schemas if available
    const journeySchemas = {};
    for (const [journey, schemaPath] of Object.entries(PATHS.journeySchemas)) {
      const resolvedPath = safeResolvePath(schemaPath);
      if (resolvedPath) {
        console.log(`Reading ${journey} journey GraphQL schema from ${resolvedPath}`);
        journeySchemas[journey] = await fs.promises.readFile(resolvedPath, 'utf8');
      }
    }
    
    return { mainSchema, journeySchemas };
  } catch (error) {
    console.error('Error reading GraphQL schemas:', error);
    throw error;
  }
}

/**
 * Generates JSON schema from GraphQL schema using graphql-codegen
 * @param {string} schema - The GraphQL schema as a string
 * @param {string} [outputName='temp-schema'] - Base name for the temporary output file
 * @returns {Promise<object>} The generated JSON schema
 */
async function generateJsonSchema(schema, outputName = 'temp-schema') {
  try {
    console.log(`Generating JSON schema from GraphQL schema (${outputName})...`);
    
    const tempOutputFile = path.join(PATHS.outputDir, `${outputName}.json`);
    
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
    console.error(`Error generating JSON schema (${outputName}):`, error);
    throw error;
  }
}

/**
 * Reads the REST API endpoint definitions
 * @returns {Promise<object>} The REST API endpoint definitions
 */
async function readRestDefinitions() {
  try {
    // Resolve the REST definitions path with fallback
    const restDefinitionsPath = safeResolvePath(
      PATHS.restDefinitions,
      path.resolve(__dirname, '../../../api/rest-endpoints.json'),
      true
    );
    
    console.log(`Reading REST API definitions from ${restDefinitionsPath}`);
    const data = await fs.promises.readFile(restDefinitionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading REST API definitions:', error);
    throw error;
  }
}

/**
 * Determines the journey type from a GraphQL field or type name
 * @param {string} name - The field or type name to analyze
 * @returns {string} The journey type
 */
function determineJourneyType(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('health') || lowerName.includes('metric') || lowerName.includes('device')) {
    return JOURNEY_TYPES.HEALTH;
  }
  
  if (lowerName.includes('care') || lowerName.includes('appointment') || lowerName.includes('provider') || 
      lowerName.includes('telemedicine') || lowerName.includes('medication')) {
    return JOURNEY_TYPES.CARE;
  }
  
  if (lowerName.includes('plan') || lowerName.includes('insurance') || lowerName.includes('claim') || 
      lowerName.includes('benefit') || lowerName.includes('coverage')) {
    return JOURNEY_TYPES.PLAN;
  }
  
  if (lowerName.includes('achievement') || lowerName.includes('reward') || lowerName.includes('quest') || 
      lowerName.includes('gamification') || lowerName.includes('leaderboard') || lowerName.includes('point')) {
    return JOURNEY_TYPES.GAMIFICATION;
  }
  
  return JOURNEY_TYPES.COMMON;
}

/**
 * Converts GraphQL schema to OpenAPI paths with journey-specific grouping
 * @param {object} jsonSchema - The GraphQL schema in JSON format
 * @param {string} [journeyType=null] - Optional journey type for specific tagging
 * @returns {object} OpenAPI paths derived from GraphQL schema
 */
function convertGraphQLToOpenAPI(jsonSchema, journeyType = null) {
  console.log(`Converting GraphQL schema to OpenAPI format${journeyType ? ` for ${journeyType} journey` : ''}...`);
  
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
      
      // Determine the journey type for this field if not specified
      const fieldJourneyType = journeyType || determineJourneyType(field.name);
      const tags = journeyType ? 
        [`${journeyType.charAt(0).toUpperCase() + journeyType.slice(1)} Journey`, 'GraphQL Queries'] : 
        [`${fieldJourneyType.charAt(0).toUpperCase() + fieldJourneyType.slice(1)} Journey`, 'GraphQL Queries'];
      
      paths[`/graphql/${field.name}`] = {
        get: {
          tags,
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
                    type: 'object',
                    properties: {
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'string'
                            },
                            locations: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  line: {
                                    type: 'integer'
                                  },
                                  column: {
                                    type: 'integer'
                                  }
                                }
                              }
                            },
                            path: {
                              type: 'array',
                              items: {
                                type: 'string'
                              }
                            }
                          }
                        }
                      }
                    }
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
      
      // Determine the journey type for this field if not specified
      const fieldJourneyType = journeyType || determineJourneyType(field.name);
      const tags = journeyType ? 
        [`${journeyType.charAt(0).toUpperCase() + journeyType.slice(1)} Journey`, 'GraphQL Mutations'] : 
        [`${fieldJourneyType.charAt(0).toUpperCase() + fieldJourneyType.slice(1)} Journey`, 'GraphQL Mutations'];
      
      paths[`/graphql/${field.name}`] = {
        post: {
          tags,
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
                    type: 'object',
                    properties: {
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            message: {
                              type: 'string'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
    });
  }
  
  return { paths, components };
}

/**
 * Converts REST API definitions to OpenAPI paths with journey-specific grouping
 * @param {object} restDefinitions - The REST API endpoint definitions
 * @returns {object} OpenAPI paths for REST endpoints
 */
function convertRestToOpenAPI(restDefinitions) {
  console.log('Converting REST definitions to OpenAPI format...');
  const paths = {};
  
  restDefinitions.endpoints.forEach(endpoint => {
    const pathKey = endpoint.path;
    
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }
    
    const method = endpoint.method.toLowerCase();
    
    // Determine journey type from path or tags
    let journeyType = JOURNEY_TYPES.COMMON;
    if (endpoint.journey) {
      journeyType = endpoint.journey;
    } else if (pathKey.includes('/health/')) {
      journeyType = JOURNEY_TYPES.HEALTH;
    } else if (pathKey.includes('/care/')) {
      journeyType = JOURNEY_TYPES.CARE;
    } else if (pathKey.includes('/plan/')) {
      journeyType = JOURNEY_TYPES.PLAN;
    } else if (pathKey.includes('/gamification/')) {
      journeyType = JOURNEY_TYPES.GAMIFICATION;
    }
    
    // Add journey-specific tag
    const journeyTag = `${journeyType.charAt(0).toUpperCase() + journeyType.slice(1)} Journey`;
    const tags = endpoint.tags || [];
    if (!tags.includes(journeyTag)) {
      tags.unshift(journeyTag);
    }
    if (!tags.includes('REST API')) {
      tags.push('REST API');
    }
    
    paths[pathKey][method] = {
      tags,
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
        }
      }
    };
    
    // Add request body if applicable
    if (endpoint.requestBody) {
      paths[pathKey][method].requestBody = endpoint.requestBody;
    }
    
    // Add API version if available
    if (endpoint.version) {
      paths[pathKey][method].description = 
        `${paths[pathKey][method].description}\n\nAPI Version: ${endpoint.version}`;
    }
  });
  
  return { paths };
}

/**
 * Merges GraphQL and REST API OpenAPI paths into a single specification
 * @param {object} graphqlOpenAPI - OpenAPI paths from GraphQL schema
 * @param {object} restOpenAPI - OpenAPI paths from REST definitions
 * @param {object} journeyGraphQLOpenAPIs - Journey-specific OpenAPI paths
 * @returns {object} Merged OpenAPI specification
 */
function mergeOpenAPISpecs(graphqlOpenAPI, restOpenAPI, journeyGraphQLOpenAPIs = {}) {
  console.log('Merging GraphQL and REST API documentation...');
  
  // Merge all paths
  let mergedPaths = {
    ...graphqlOpenAPI.paths,
    ...restOpenAPI.paths
  };
  
  // Merge journey-specific paths
  Object.values(journeyGraphQLOpenAPIs).forEach(journeyAPI => {
    mergedPaths = {
      ...mergedPaths,
      ...journeyAPI.paths
    };
  });
  
  // Merge all components.schemas
  const mergedSchemas = {
    ...(graphqlOpenAPI.components && graphqlOpenAPI.components.schemas)
  };
  
  // Merge journey-specific schemas
  Object.values(journeyGraphQLOpenAPIs).forEach(journeyAPI => {
    if (journeyAPI.components && journeyAPI.components.schemas) {
      Object.entries(journeyAPI.components.schemas).forEach(([schemaName, schema]) => {
        // Only add if not already present or override with more specific schema
        if (!mergedSchemas[schemaName] || schemaName.includes(journeyAPI.journeyType)) {
          mergedSchemas[schemaName] = schema;
        }
      });
    }
  });
  
  return {
    openapi: '3.0.0',
    info: {
      title: 'AUSTA SuperApp API',
      description: 'API documentation for the AUSTA SuperApp',
      version: '2.0.0',
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
    tags: [
      {
        name: 'Health Journey',
        description: 'APIs related to the Health journey'
      },
      {
        name: 'Care Journey',
        description: 'APIs related to the Care journey'
      },
      {
        name: 'Plan Journey',
        description: 'APIs related to the Plan journey'
      },
      {
        name: 'Gamification Journey',
        description: 'APIs related to the Gamification system'
      },
      {
        name: 'Common',
        description: 'APIs shared across multiple journeys'
      },
      {
        name: 'GraphQL Queries',
        description: 'GraphQL query operations'
      },
      {
        name: 'GraphQL Mutations',
        description: 'GraphQL mutation operations'
      },
      {
        name: 'REST API',
        description: 'REST API endpoints'
      }
    ],
    paths: mergedPaths,
    components: {
      schemas: mergedSchemas,
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
    ]
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
    throw error;
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
    case 'Time':
      return { type: 'string', format: 'time' };
    case 'JSON':
      return { type: 'object', additionalProperties: true };
    case 'JSONObject':
      return { type: 'object', additionalProperties: true };
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
    
    // Read GraphQL schemas (main and journey-specific)
    const { mainSchema, journeySchemas } = await readGraphQLSchemas();
    
    // Generate JSON schema from main GraphQL schema
    const mainJsonSchema = await generateJsonSchema(mainSchema, 'main-schema');
    
    // Generate JSON schemas for journey-specific schemas
    const journeyJsonSchemas = {};
    for (const [journey, schema] of Object.entries(journeySchemas)) {
      journeyJsonSchemas[journey] = await generateJsonSchema(schema, `${journey}-schema`);
    }
    
    // Read REST API endpoint definitions
    const restDefinitions = await readRestDefinitions();
    
    // Convert main GraphQL schema to OpenAPI paths
    const graphqlOpenAPI = convertGraphQLToOpenAPI(mainJsonSchema);
    
    // Convert journey-specific GraphQL schemas to OpenAPI paths
    const journeyGraphQLOpenAPIs = {};
    for (const [journey, jsonSchema] of Object.entries(journeyJsonSchemas)) {
      journeyGraphQLOpenAPIs[journey] = {
        ...convertGraphQLToOpenAPI(jsonSchema, journey),
        journeyType: journey
      };
    }
    
    // Convert REST API definitions to OpenAPI paths
    const restOpenAPI = convertRestToOpenAPI(restDefinitions);
    
    // Merge all OpenAPI paths
    const openAPISpec = mergeOpenAPISpecs(graphqlOpenAPI, restOpenAPI, journeyGraphQLOpenAPIs);
    
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