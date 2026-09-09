import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class StorageHealthIndicator {
  private readonly client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {
    this.publicBucket = this.configService.getOrThrow<string>(
      'storage.publicBucket',
    );
    this.privateBucket = this.configService.getOrThrow<string>(
      'storage.privateBucket',
    );

    this.client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('storage.endpoint'),
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

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await Promise.all([
        this.client.send(new HeadBucketCommand({ Bucket: this.publicBucket })),
        this.client.send(new HeadBucketCommand({ Bucket: this.privateBucket })),
      ]);

      return indicator.up();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Storage connection failed';
      return indicator.down({ message: errorMessage });
    }
  }
}
