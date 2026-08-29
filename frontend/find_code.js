import fs from 'fs';
import path from 'path';

function searchDirectory(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                searchDirectory(fullPath, pattern);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
                searchFile(fullPath, pattern);
            }
        }
    }
}

function searchFile(filePath, pattern) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const regex = new RegExp(pattern, 'i');
    let printedHeader = false;
    
    lines.forEach((line, index) => {
        if (regex.test(line)) {
            if (!printedHeader) {
                console.log(`\n--- Searching ${filePath} for: ${pattern} ---`);
                printedHeader = true;
            }
            console.log(`Line ${index + 1}: ${line.trim()}`);
            // Print surrounding lines
            const start = Math.max(0, index - 2);
            const end = Math.min(lines.length - 1, index + 2);
            for (let i = start; i <= end; i++) {
                if (i !== index) {
                    console.log(`  [${i + 1}] ${lines[i]}`);
                } else {
                    console.log(`> [${i + 1}] ${lines[i]}`);
                }
            }
        }
    });
}

const args = process.argv.slice(2);
const query = args[0] || 'cancel';
searchDirectory('.', query);
