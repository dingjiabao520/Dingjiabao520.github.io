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
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 直接使用字符串替换，替换所有出现的"文科教学楼"为"teaching-building"
        // 这种方式最直接，能处理所有情况
        const updatedContent = content.replace(/文科教学楼/g, 'teaching-building');
        
        // 保存修改后的文件
        if (updatedContent !== content) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            const replacedCount = (content.match(/文科教学楼/g) || []).length;
            console.log(`  ✅ 已替换 ${replacedCount} 个中文引用`);
        } else {
            console.log(`  ✅ 文件已正确，无需修改`);
        }
    }
});

console.log('\n🎉 所有.gltf文件简单修复完成！');
