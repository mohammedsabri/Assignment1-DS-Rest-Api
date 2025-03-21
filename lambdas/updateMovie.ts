import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

  const body = JSON.parse(event.body || "{}");

  if (Object.keys(body).length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "No update fields provided" }),
    };
  }

  try {
    const updateExpressionParts: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};
    Object.keys(body).forEach((key) => {
      updateExpressionParts.push(`#${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = body[key];
    });

    const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: parseInt(movieId) }, // Assuming movieId is a number
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(body).reduce(
          (acc, key) => ({ ...acc, [`#${key}`]: key }),
          {}
        ),
        ReturnValues: "ALL_NEW",
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Movie updated successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to update movie", error }),
    };
  }
};
