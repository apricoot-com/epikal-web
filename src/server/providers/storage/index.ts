import { StorageProvider } from './interface';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';

let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
    if (storageProvider) return storageProvider;

    let type = process.env.STORAGE_TYPE;

    // Auto-detect S3 if not explicitly set
    if (!type && process.env.STORAGE_S3_BUCKET && process.env.STORAGE_S3_ACCESS_KEY && process.env.STORAGE_S3_SECRET_KEY) {
        type = 's3';
    }

    // Default to local if still not determined
    if (!type) {
        type = 'local';
    }

    if (type === 's3') {
        storageProvider = new S3StorageProvider();
    } else {
        storageProvider = new LocalStorageProvider();
    }

    return storageProvider;
}

export * from './interface';
