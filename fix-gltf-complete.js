const fs = require('fs');
const path = require('path');

// 遍历所有.gltf文件
const gltfDir = './gltf-models';
const files = fs.readdirSync(gltfDir);

files.forEach(file => {
    if (file.endsWith('.gltf')) {
        const filePath = path.join(gltfDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 直接替换所有中文buffer名称，无论在什么位置
        let updatedContent = content;
        
        // 替换主文件的所有引用
        updatedContent = updatedContent.replace(/文科教学楼.bin/g, 'teaching-building.bin');
        
        // 替换分块文件的所有引用
        for (let i = 1; i <= 14; i++) {
            updatedContent = updatedContent.replace(new RegExp(`文科教学楼_${i}.bin`, 'g'), `teaching-building_${i}.bin`);
        }
        
        // 保存修改后的文件
        if (updatedContent !== content) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`已彻底修复: ${file}`);
        }
    }
});
console.log('所有.gltf文件彻底修复完成！');
