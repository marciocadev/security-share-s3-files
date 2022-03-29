# security-share-s3-files

## bucket
exemplo: `https://github.com/aws-samples/serverless-patterns/blob/main/apigw-s3-cdk/cdk/lib/apigw-s3-cdk-stack.ts`


### GET
```
curl --location --request GET 'https://{restId}.execute-api.us-east-1.amazonaws.com/prod/assets/files/README.md'
```

#### no postman coloque na URL
`'https://{restId}.execute-api.us-east-1.amazonaws.com/prod/assets/:folder/:key'`

  * folder = files
  * key = README.md


### PUT
```
curl --location --request PUT 'https://ikekvxm1xg.execute-api.us-east-1.amazonaws.com/prod/assets/files/README.md' \
--header 'Content-Type: text/markdown' \
--data-binary '@/C:/Dev/marciocadev/security-share-s3-files/README.md'
```

#### no postman coloque na URL
`'https://{restId}.execute-api.us-east-1.amazonaws.com/prod/assets/:folder/:key'`

  * folder = files
  * key = README.md

e em body, selecione `binary` e anexe o arquivo
