import { getStorageProvider } from '../src/server/providers/storage/index';
import { S3StorageProvider } from '../src/server/providers/storage/s3';
import { LocalStorageProvider } from '../src/server/providers/storage/local';

// Helper to reset module for fresh require
function resetModule() {
    delete require.cache[require.resolve('../src/server/providers/storage/index')];
}

async function runTests() {
    console.log("Running Storage Provider Selection Tests...\n");

    // Test 1: Default behavior (no env vars) -> Local
    resetModule();
    process.env.STORAGE_TYPE = '';
    delete process.env.STORAGE_S3_BUCKET;
    delete process.env.STORAGE_S3_ACCESS_KEY;
    delete process.env.STORAGE_S3_SECRET_KEY;

    // Check module requires fresh import to pick up env changes if it caches internal state
    // Note: The provided index.ts caches the provider instance. We need to handle that if we want to test multiple cases in one run.
    // In index.ts: let storageProvider: StorageProvider | null = null;
    // We cannot easily reset that internal variable without modifying the code or reloading the module.
    // So for this script, we will rely on reloading the module.

    let { getStorageProvider } = require('../src/server/providers/storage/index');
    let provider = getStorageProvider();

    if (provider instanceof LocalStorageProvider) {
        console.log("✅ Test 1 Passed: Defaults to LocalStorageProvider when no env vars set.");
    } else {
        console.error("❌ Test 1 Failed: Expected LocalStorageProvider.");
    }

    // Test 2: Auto-detect S3
    resetModule();
    process.env.STORAGE_TYPE = '';
    process.env.STORAGE_S3_BUCKET = 'my-bucket';
    process.env.STORAGE_S3_ACCESS_KEY = 'key';
    process.env.STORAGE_S3_SECRET_KEY = 'secret';

    ({ getStorageProvider } = require('../src/server/providers/storage/index'));
    provider = getStorageProvider();

    if (provider instanceof S3StorageProvider) {
        console.log("✅ Test 2 Passed: Auto-detects S3StorageProvider when S3 env vars are present.");
    } else {
        console.error("❌ Test 2 Failed: Expected S3StorageProvider.");
    }

    // Test 3: Explicit Local override
    resetModule();
    process.env.STORAGE_TYPE = 'local';
    process.env.STORAGE_S3_BUCKET = 'my-bucket'; // S3 vars present but should be ignored
    process.env.STORAGE_S3_ACCESS_KEY = 'key';
    process.env.STORAGE_S3_SECRET_KEY = 'secret';

    ({ getStorageProvider } = require('../src/server/providers/storage/index'));
    provider = getStorageProvider();

    if (provider instanceof LocalStorageProvider) {
        console.log("✅ Test 3 Passed: Respects STORAGE_TYPE='local' even if S3 vars are present.");
    } else {
        console.error("❌ Test 3 Failed: Expected LocalStorageProvider.");
    }

    // Test 4: CloudFront URL generation
    resetModule();
    process.env.STORAGE_TYPE = 's3';
    process.env.STORAGE_S3_BUCKET = 'test-bucket';
    process.env.STORAGE_S3_ACCESS_KEY = 'key';
    process.env.STORAGE_S3_SECRET_KEY = 'secret';
    process.env.STORAGE_CLOUDFRONT_DOMAIN = 'https://cdn.example.com';

    ({ getStorageProvider } = require('../src/server/providers/storage/index'));
    provider = getStorageProvider();

    if (provider instanceof S3StorageProvider) {
        const url = provider.getPublicUrl('test/file.jpg');
        if (url === 'https://cdn.example.com/test/file.jpg') {
            console.log("✅ Test 4 Passed: Generates correct CloudFront URL.");
        } else {
            console.error(`❌ Test 4 Failed: Expected 'https://cdn.example.com/test/file.jpg', got '${url}'`);
        }
    } else {
        console.error("❌ Test 4 Failed: Expected S3StorageProvider.");
    }

    console.log("\nTests Completed.");
}

runTests().catch(console.error);
