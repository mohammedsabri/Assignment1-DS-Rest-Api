import * as cdk from "aws-cdk-lib";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies } from "../seed/movies";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    function generateBatch(items: any[]): { PutRequest: { Item: any } }[] {
      return items.map((item) => ({
        PutRequest: { Item: item },
      }));
    }

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    // Functions 
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getAllMoviesFn = new lambdanode.NodejsFunction(
      this,
      "GetAllMoviesFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getAllMovies.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
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

    const deleteMovieFn = new lambdanode.NodejsFunction(this, "DeleteMovieFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/deleteMovies.ts`,
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

    const getMovieCastMembersFn = new lambdanode.NodejsFunction(
      this,
      "GetCastMemberFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn],
      }),
    });

    // Permissions 
    moviesTable.grantReadData(getMovieByIdFn);
    moviesTable.grantReadData(getAllMoviesFn);
    moviesTable.grantReadWriteData(newMovieFn);
    moviesTable.grantReadWriteData(deleteMovieFn); // Grant DELETE permissions
    moviesTable.grantReadData(getMovieCastMembersFn);
    moviesTable.grantReadWriteData(updateMovieFn);


    // REST API 
    const api = new apig.RestApi(this, "RestAPI", {
      description: "demo api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    // Movies endpoint
    const moviesEndpoint = api.root.addResource("movies");
    moviesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
    );
    moviesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newMovieFn, { proxy: true })
    );

    const movieCastEndpoint = moviesEndpoint.addResource("cast");
    movieCastEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
    );

    // Detail movie endpoint
    const specificMovieEndpoint = moviesEndpoint.addResource("{movieId}");
    specificMovieEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
    );

    // Add DELETE method for deleting movie
    specificMovieEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteMovieFn, { proxy: true })
    );
    
    // Add PUT method for updating a movie
specificMovieEndpoint.addMethod(
  "PUT",
  new apig.LambdaIntegration(updateMovieFn, { proxy: true })
);
  }
}
