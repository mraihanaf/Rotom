import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'minioAccessKey',
    secretAccessKey: 'minioSecretKey',
  },
  endpoint: 'http://localhost:9000',
});

void (async () => {
  const key = `test/${crypto.randomUUID()}.txt`;

  const { Buckets } = await s3.send(new ListBucketsCommand());
  console.log(Buckets);

  const command = new PutObjectCommand({
    Bucket: 'rotom-development',
    Key: key,
    ContentType: 'text/plain',
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 300,
  });

  console.log(signedUrl);

  const downloadSignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: 'rotom-development',
      Key: key,
    }),
    {
      expiresIn: 300,
    },
  );

  console.log(downloadSignedUrl);
})();
