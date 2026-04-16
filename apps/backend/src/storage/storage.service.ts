import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly s3Public: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET!;
    this.s3 = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
    this.s3Public = process.env.S3_PUBLIC_ENDPOINT
      ? new S3Client({
          region: process.env.S3_REGION,
          endpoint: process.env.S3_PUBLIC_ENDPOINT,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY!,
            secretAccessKey: process.env.S3_SECRET_KEY!,
          },
          forcePathStyle: true,
        })
      : this.s3;
  }

  async uploadStreamFileToS3({
    key,
    body,
    contentType,
  }: {
    key: string;
    body: Readable;
    contentType: string;
  }) {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    await upload.done();
  }

  async getPresignedDownloadUrl({
    key,
    expiresIn = 3600,
  }: {
    key: string;
    expiresIn?: number;
  }) {
    return await getSignedUrl(
      this.s3Public,
      new GetObjectCommand({
        Key: key,
        Bucket: this.bucket,
      }),
      { expiresIn },
    );
  }

  async deleteObject({ key }: { key: string }) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
