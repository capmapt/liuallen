#!/usr/bin/env node

// 清理data.js中的重复数据
import { strokeMap, principleData, compressedStrokeData } from '../js/data.js';

console.log('原始字符数:', Object.keys(compressedStrokeData).length);
console.log('strokeMap条目:', Object.keys(strokeMap).length);
console.log('principleData条目:', Object.keys(principleData).length);

// 生成清理后的数据文件
const output = `// 汉字笔画数据 - 已优化去重
export const strokeMap = ${JSON.stringify(strokeMap, null, 2)};

export const principleData = ${JSON.stringify(principleData, null, 2)};

export const compressedStrokeData = ${JSON.stringify(compressedStrokeData, null, 2)};
`;

console.log('\n生成的文件大小:', (output.length / 1024).toFixed(2), 'KB');
console.log('原文件大小: 167 KB');
console.log('优化后减少:', ((1 - output.length / (167 * 1024)) * 100).toFixed(1), '%');

// 写入新文件
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = join(__dirname, '../js/data.clean.js');

writeFileSync(outputPath, output, 'utf8');
console.log('\n清理后的文件已保存到: js/data.clean.js');
