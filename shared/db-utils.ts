import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Creates a configured DynamoDB Document Client for Movies
 * @returns DynamoDBDocumentClient
 */
export function createMoviesDdbDocClient() {
  const ddbClient = new DynamoDBClient({ 
    region: process.env.REGION || "eu-west-1"
  });
  
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

/**
 * Standardized API response formatter for Movies API
 * @param statusCode HTTP status code
 * @param body Response body
 * @returns Formatted API Gateway response
 */
export function formatMoviesResponse(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,x-api-key",
      "Access-Control-Allow-Methods": "OPTIONS,GET,PUT,POST",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(body),
  };
}
