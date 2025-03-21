import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import Ajv from "ajv";

// Initialize DynamoDB client
const ddbDocClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

// JSON Schema validation setup
const ajv = new Ajv();
const movieSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    adult: { type: "boolean" },
    backdrop_path: { type: "string" },
    genre_ids: {
      type: "array",
      items: { type: "number" }
    },
    original_language: { type: "string" },
    original_title: { type: "string" },
    overview: { type: "string" },
    popularity: { type: "number" },
    poster_path: { type: "string" },
    release_date: { type: "string" },
    title: { type: "string" },
    video: { type: "boolean" },
    vote_average: { type: "number" },
    vote_count: { type: "number" }
  }
};
const validate = ajv.compile(movieSchema);

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const movieId = event?.pathParameters?.movieId;
  if (!movieId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Movie ID is required" }),
    };
  }

  const parsedMovieId = isNaN(Number(movieId)) ? movieId : Number(movieId);
  const body: Record<string, any> = JSON.parse(event.body || "{}");

  if (Object.keys(body).length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No update fields provided" }),
    };
  }

  // Prevent updating the primary key
  if (body.id !== undefined) {
    delete body.id;
  }

  // Validate request body
  if (!validate(body)) {
    console.error("Validation errors:", validate.errors);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid data format", errors: validate.errors }),
    };
  }

  try {
    const updateExpressionParts: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    Object.keys(body).forEach((key) => {
      updateExpressionParts.push(`#${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = body[key];
      expressionAttributeNames[`#${key}`] = key;
    });

    const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

    console.log("Update Expression:", updateExpression);
    console.log("Expression Attribute Values:", JSON.stringify(expressionAttributeValues, null, 2));
    console.log("Expression Attribute Names:", JSON.stringify(expressionAttributeNames, null, 2));

    const result = await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: parsedMovieId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: "ALL_NEW",
      })
    );

    console.log("DynamoDB Update Result:", JSON.stringify(result, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Movie updated successfully", updatedAttributes: result.Attributes }),
    };
  } catch (error) {
    console.error("Update failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to update movie", error: (error as Error).message }),
    };
  }
};
