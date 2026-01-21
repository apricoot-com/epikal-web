
import fs from "fs";
import path from "path";

const SRC_DIR = path.join(process.cwd(), "templates");
const DEST_DIR = path.join(process.cwd(), "public/templates");

function copyDir(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${entry.name}`);
        }
    }
}

console.log(`🏗️ Building Templates...`);
console.log(`Src: ${SRC_DIR}`);
console.log(`Dest: ${DEST_DIR}`);

if (fs.existsSync(SRC_DIR)) {
    copyDir(SRC_DIR, DEST_DIR);
    console.log("✅ Templates built successfully.");
} else {
    console.error("❌ Templates source directory not found.");
    process.exit(1);
}
