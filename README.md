## Serverless REST Assignment - Distributed Systems.

__Name:__ ....Mohammed Sabri .....

__Demo:__ ... https://youtu.be/PUNPdzs-Kjs
   ......

### Context.

Context:This API manages movies

Table item attributes:
+ MovieID - number  (Partition key)


### App API endpoints.

Movies Endpoints 
POST /movies – Add a new movie.
GET /movies – Retrieve all movies.
GET /movies/{id} – Retrieve details of a specific movie.
PUT /movies/{id} – Update a movie’s details.
DELETE /movies/{id} – Delete a movie.


### Features.

#### Translation persistence (if completed)



#### Custom L2 Construct (if completed)

[State briefly the infrastructure provisioned by your custom L2 construct. Show the structure of its input props object and list the public properties it exposes, e.g. taken from the Cognito lab,

Construct Input props object:
~~~
type AuthApiProps = {
 userPoolId: string;
 userPoolClientId: string;
}
~~~
Construct public properties
~~~
export class MyConstruct extends Construct {
 public  PropertyName: type
 etc.
~~~
 ]

#### Multi-Stack app (if completed)

[Explain briefly the stack composition of your app - no code excerpts required.]

#### Lambda Layers (if completed)

[Explain briefly where you used the Layers feature of the AWS Lambda service - no code excerpts required.]


#### API Keys. (if completed)

[Explain briefly how to implement API key authentication to protect API Gateway endpoints. Include code excerpts from your app to support this. ][]

~~~ts
// This is a code excerpt markdown 
let foo : string = 'Foo'
console.log(foo)
~~~

###  Extra (If relevant).

[ State any other aspects of your solution that use CDK/serverless features not covered in the lectures ]
