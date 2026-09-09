import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';

export type StorageVisibility = 'public' | 'private';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly buckets: Record<StorageVisibility, string>;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.getOrThrow<string>('storage.endpoint');

    this.buckets = {
      public: this.configService.getOrThrow<string>('storage.publicBucket'),
      private: this.configService.getOrThrow<string>('storage.privateBucket'),
    };

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.getOrThrow<string>('storage.region'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          'storage.accessKeyId',
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          'storage.secretAccessKey',
        ),
      },
      forcePathStyle: false,
    });
  }

  private buildObjectKey(prefix: string, originalName: string): string {
    const uniqueSuffix = `${Date.now()}-${randomBytes(6).toString('hex')}`;
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return `${prefix}/${uniqueSuffix}-${safeName}`;
  }

  async uploadFile(
    visibility: StorageVisibility,
    prefix: string,
    file: Express.Multer.File,
  ): Promise<{ key: string; size: number; url: string | null }> {
    const key = this.buildObjectKey(prefix, file.originalname);
    const bucket = this.buckets[visibility];

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    this.logger.log(`File uploaded to ${visibility} bucket: ${key}`);

    return {
      key,
      size: file.size,
      url: visibility === 'public' ? this.buildPublicUrl(bucket, key) : null,
    };
  }

  private buildPublicUrl(bucket: string, key: string): string {
    const region = this.endpoint
      .replace('https://s3.', '')
      .replace('https://', '');
    return `https://${bucket}.s3.${region}/${key}`;
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.buckets.private,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteFile(visibility: StorageVisibility, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.buckets[visibility], Key: key }),
    );
  }
}
