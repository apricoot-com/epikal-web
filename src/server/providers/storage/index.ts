import { StorageProvider } from './interface';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';

let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
    if (storageProvider) return storageProvider;

    const type = process.env.STORAGE_TYPE || 'local';

    if (type === 's3') {
        storageProvider = new S3StorageProvider();
    } else {
        storageProvider = new LocalStorageProvider();
    }

    return storageProvider;
}

export * from './interface';
