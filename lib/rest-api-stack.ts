import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class MoviesAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table with composite key (userId, movieId)
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "movieId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    // GSI for querying movies by category
    // moviesTable.addGlobalSecondaryIndex({
    //   indexName: "CategoryIndex",
    //   partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
    //   sortKey: { name: "category", type: dynamodb.AttributeType.STRING },
    // });

    // API key for authentication
    // const apiKey = new apigateway.ApiKey(this, "MoviesApiKey", {
    //   apiKeyName: "movies-api-key",
    //   description: "API Key for POST and PUT operations",
    //   enabled: true,
    // });

    // Lambda functions
    const getMoviesByUserFn = new lambdanode.NodejsFunction(this, "GetMoviesByUserFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getMoviesByUser.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getMovieByIdFn = new lambdanode.NodejsFunction(this, "GetMovieByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getMovieById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const addMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addMovie.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const updateMovieFn = new lambdanode.NodejsFunction(this, "UpdateMovieFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateMovie.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const deleteMovieFn = new lambdanode.NodejsFunction(this, "DeleteMovieFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/deleteMovie.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const translateMovieFn = new lambdanode.NodejsFunction(
      this,
      "TranslateMoviesFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/translateMovies.ts`,
        timeout: cdk.Duration.seconds(15),
        memorySize: 256,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    // Grant permission for Lambda to use Amazon Translate service
    const translatePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["translate:TranslateText"],
      resources: ["*"]
    });
    translateMovieFn.addToRolePolicy(translatePolicy);


    // Grant permissions to Lambda functions
    moviesTable.grantReadData(getMoviesByUserFn);
    moviesTable.grantReadData(getMovieByIdFn);
    moviesTable.grantReadWriteData(addMovieFn);
    moviesTable.grantReadWriteData(updateMovieFn);
    moviesTable.grantReadWriteData(deleteMovieFn);
    moviesTable.grantReadWriteData(translateMovieFn);


    // API Gateway
    // const api = new apigateway.RestApi(this, "MoviesAPI", {
    //   description: "Movies API",
    //   deployOptions: { stageName: "dev" },
    //   defaultCorsPreflightOptions: {
    //     allowHeaders: ["Content-Type", "X-Amz-Date", "x-api-key"],
    //     allowMethods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
    //     allowOrigins: ["*"],
    //   },
    // });

    // Usage Plan with API Key
    // const usagePlan = api.addUsagePlan("MoviesApiUsagePlan", {
    //   name: "MoviesApiUsagePlan",
    //   throttle: { rateLimit: 10, burstLimit: 5 },
    // });
    // usagePlan.addApiStage({ stage: api.deploymentStage });
    // usagePlan.addApiKey(apiKey);

    // API Endpoints
    const moviesResource = api.root.addResource("movies");
    const userMovies = moviesResource.addResource("{userId}");
    userMovies.addMethod("GET", new apigateway.LambdaIntegration(getMoviesByUserFn));

    const movie = userMovies.addResource("{movieId}");
    movie.addMethod("GET", new apigateway.LambdaIntegration(getMovieByIdFn));
    movie.addMethod("POST", new apigateway.LambdaIntegration(addMovieFn), { apiKeyRequired: true });
    movie.addMethod("PUT", new apigateway.LambdaIntegration(updateMovieFn), { apiKeyRequired: true });
    movie.addMethod("DELETE", new apigateway.LambdaIntegration(deleteMovieFn), { apiKeyRequired: true });
  }
}
