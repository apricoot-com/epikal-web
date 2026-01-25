import fs from 'fs';
import path from 'path';
import { StorageProvider } from './interface';

export class LocalStorageProvider implements StorageProvider {
    private baseDir: string;
    private baseUrl: string;

    constructor() {
        this.baseDir = path.join(process.cwd(), 'public', 'uploads');
        this.baseUrl = '/uploads';

        // Ensure the base directory exists
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async upload(filePath: string, content: Buffer | string, contentType: string): Promise<string> {
        const fullPath = path.join(this.baseDir, filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content);
        return this.getPublicUrl(filePath);
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.baseDir, filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }

    getPublicUrl(filePath: string): string {
        // Normalize path separators to forward slashes for URLs
        const normalizedPath = filePath.replace(/\\/g, '/');
        return `${this.baseUrl}/${normalizedPath}`;
    }
}
