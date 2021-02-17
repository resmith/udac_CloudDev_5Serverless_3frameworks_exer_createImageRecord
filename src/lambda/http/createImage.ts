import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk';
import * as uuid from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE


// URl Signature: POST /group/{groupId}/image
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event)

  // *** Validations (in addition to model url validation)
  let errorMessage = "";

  const groupId = event.pathParameters.groupId
  const validGroupId = await groupExists(groupId)
  if (!validGroupId) { errorMessage = 'Group does not exist'} 

  const parsedBody = JSON.parse(event.body)
  const title = parsedBody.title;
  if (!title) { errorMessage = 'Title not provided'}

  if (errorMessage != "") {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Group does not exist'
      })
    }
  }

  // Create the image
  const newImage = await createImage(groupId, title)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: newImage
  }
}

async function groupExists(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId
      }
    })
    .promise()

  console.log('Get group: ', result)
  return !!result.Item
}

async function createImage(groupId: string, event: any) {
  const timeStamp = new Date().toISOString()
  const imageId = uuid.v4();
  const bodyInfo = JSON.parse(event.body);
  const { title }  = bodyInfo;
  
  const newItem = {
    groupId,
    timeStamp,
    imageId,
    title
  }

  console.log('Creating new image: ', newItem)
  const result = await docClient.put({
    TableName: imagesTable,
    Item: newItem
  }).promise()

  const bodyResponse = { ...newItem, ...result }

  console.log('Create image item+result: ', bodyResponse)
  return bodyResponse
}




