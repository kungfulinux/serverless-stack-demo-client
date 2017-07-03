import AWS from 'aws-sdk';
import apigClientFactory from 'aws-api-gateway-client';
import config from '../config.js';

export async function invokeApig(
  { path,
    method = 'GET',
    params = {},
    body = {} }, userToken) {

  await getAwsCredentials(userToken);

  const apigClient = apigClientFactory.newClient({
    accessKey: AWS.config.credentials.accessKeyId,
    secretKey: AWS.config.credentials.secretAccessKey,
    sessionToken: AWS.config.credentials.sessionToken,
    region: config.apiGateway.REGION,
    invokeUrl: config.apiGateway.URL
  });

  const results = await apigClient.invokeApi(params, path, method, {}, body);

  return results.data;
}

export function getAwsCredentials(userToken) {
  if (AWS.config.credentials && (new Date()) <= AWS.config.credentials.expireTime) {
    return;
  }

  const authenticator = `cognito-idp.${config.cognito.REGION}.amazonaws.com/${config.cognito.USER_POOL_ID}`;

  AWS.config.update({ region: config.cognito.REGION });

  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: config.cognito.IDENTITY_POOL_ID,
    Logins: {
      [authenticator]: userToken
    }
  });

  return AWS.config.credentials.getPromise();
}

export async function s3Upload(file, userToken) {
  await getAwsCredentials(userToken);

  const s3 = new AWS.S3({
    params: {
      Bucket: config.s3.BUCKET,
    }
  });
  const filename = `${AWS.config.credentials.identityId}-${Date.now()}-${file.name}`;

  return s3.upload({
    Key: filename,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read',
  }).promise();
}
