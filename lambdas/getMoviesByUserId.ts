import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    
    // Extract path parameter
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing userId path parameter" }),
      };
    }

    // Extract query parameters if any
    const queryParams = event.queryStringParameters || {};
    const { genre, releaseYear } = queryParams;
    
    let params: any;
    
    // If filtering by genre, use the GenreIndex GSI
    if (genre) {
      params = {
        TableName: process.env.TABLE_NAME,
        IndexName: "GenreIndex",  // Assuming a GSI for genre-based queries
        KeyConditionExpression: "userId = :userId AND genre = :genre",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":genre": genre,
        },
      };
    } else {
      // Query for all movies belonging to the user
      params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      };
    }
    
    // If filtering by releaseYear, add a filter expression
    if (releaseYear) {
      params.FilterExpression = "releaseYear = :releaseYear";
      params.ExpressionAttributeValues[":releaseYear"] = parseInt(releaseYear);
    }

    const commandOutput = await ddbDocClient.send(new QueryCommand(params));

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Successfully retrieved movies",
        movies: commandOutput.Items || [],
        count: commandOutput.Count || 0,
      }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to retrieve movies",
        errorMsg: error.message,
        errorStack: error.stack,
      }),
    };
  }
};

// Create DynamoDB Document Client
function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  return DynamoDBDocumentClient.from(ddbClient, { marshallOptions, unmarshallOptions });
}
