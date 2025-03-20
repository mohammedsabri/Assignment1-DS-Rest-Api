// lambdas/deleteMovie.ts
import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

export const handler: APIGatewayProxyHandler = async (event) => {
  const movieId = event?.pathParameters?.movieId;

  if (!movieId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Movie ID is required" }),
    };
  }

  try {
    const result = await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          id: parseInt(movieId), // Assuming movieId is a number
        },
      })
    );

    if (result) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Movie deleted successfully" }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Movie not found" }),
      };
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to delete movie", error }),
    };
  }
};
