export interface StorageProvider {
    /**
     * Upload a file to the storage
     * @param path Full path within the storage (including filename)
     * @param content Buffer or string content of the file
     * @param contentType MIME type of the file
     * @returns The public URL of the uploaded file
     */
    upload(path: string, content: Buffer | string, contentType: string): Promise<string>;

    /**
     * Delete a file from the storage
     * @param path Full path within the storage
     */
    delete(path: string): Promise<void>;

    /**
     * Get the public URL for a file
     * @param path Full path within the storage
     * @returns The public URL
     */
    getPublicUrl(path: string): string;
}
