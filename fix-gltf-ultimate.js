const fs = require('fs');
const path = require('path');

// 遍历所有.gltf文件
const gltfDir = './gltf-models';
const files = fs.readdirSync(gltfDir);

files.forEach(file => {
    if (file.endsWith('.gltf')) {
        const filePath = path.join(gltfDir, file);
        console.log(`\n处理文件: ${file}`);
        
        // 读取文件内容
        let content = fs.readFileSync(filePath, 'utf8');
        console.log(`原始文件大小: ${content.length} 字符`);
        
        // 统计原始中文引用数量
        const originalCount = (content.match(/文科教学楼/g) || []).length;
        console.log(`原始中文引用数量: ${originalCount}`);
        
        // 修复：使用正则表达式替换所有可能的中文引用格式
        // 匹配各种格式："文科教学楼.bin"、"文科教学楼_7.bin"、"文科教学楼 7.bin"等
        let updatedContent = content;
        
        // 1. 替换主文件引用
        updatedContent = updatedContent.replace(/文科教学楼\.bin/g, 'teaching-building.bin');
        
        // 2. 替换所有带数字后缀的引用，支持下划线、空格和中文数字
        // 使用全局替换，处理所有可能的格式
        updatedContent = updatedContent.replace(/文科教学楼[ _]*(\d+)\.bin/g, (match, num) => {
            console.log(`  替换: ${match} -> teaching-building_${num}.bin`);
            return `teaching-building_${num}.bin`;
        });
        
        // 3. 安全检查：确保没有遗漏的中文引用
        const remainingChinese = (updatedContent.match(/文科教学楼/g) || []).length;
        
        // 保存修改后的文件
        if (updatedContent !== content) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`  ✅ 已修复: ${file}`);
            console.log(`  替换后中文引用数量: ${remainingChinese}`);
        } else {
            console.log(`  ✅ 文件已正确，无需修改`);
        }
    }
});

console.log('\n🎉 所有.gltf文件终极修复完成！');
