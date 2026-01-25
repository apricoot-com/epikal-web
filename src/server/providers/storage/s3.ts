import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from './interface';

export class S3StorageProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;
    private cloudFrontDomain?: string;

    constructor() {
        this.bucket = process.env.STORAGE_S3_BUCKET || '';
        this.cloudFrontDomain = process.env.STORAGE_CLOUDFRONT_DOMAIN;

        this.client = new S3Client({
            region: process.env.STORAGE_S3_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.STORAGE_S3_ACCESS_KEY || '',
                secretAccessKey: process.env.STORAGE_S3_SECRET_KEY || '',
            },
        });
    }

    async upload(path: string, content: Buffer | string, contentType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: content,
            ContentType: contentType,
        });

        await this.client.send(command);
        return this.getPublicUrl(path);
    }

    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        await this.client.send(command);
    }

    getPublicUrl(path: string): string {
        if (this.cloudFrontDomain) {
            // Use CloudFront domain if available
            const domain = this.cloudFrontDomain.startsWith('http')
                ? this.cloudFrontDomain
                : `https://${this.cloudFrontDomain}`;
            return `${domain}/${path}`;
        }

        // Default to S3 public URL (assuming the bucket/objects are public)
        return `https://${this.bucket}.s3.amazonaws.com/${path}`;
    }
}
