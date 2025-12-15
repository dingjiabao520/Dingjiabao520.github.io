const fs = require('fs');
const path = require('path');

// 遍历所有.gltf文件
const gltfDir = './gltf-models';
const files = fs.readdirSync(gltfDir);

files.forEach(file => {
    if (file.endsWith('.gltf')) {
        const filePath = path.join(gltfDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        try {
            // 解析JSON
            const gltfData = JSON.parse(content);
            
            // 更新buffers中的uri
            if (gltfData.buffers && Array.isArray(gltfData.buffers)) {
                gltfData.buffers.forEach((buffer, index) => {
                    if (buffer.uri) {
                        // 替换中文文件名
                        let newUri = buffer.uri;
                        
                        // 替换主文件
                        newUri = newUri.replace('文科教学楼.bin', 'teaching-building.bin');
                        newUri = newUri.replace(/\\u6587\\u79d1\\u6559\\u5b66\\u697c\.bin/g, 'teaching-building.bin');
                        
                        // 替换分块文件
                        for (let i = 1; i <= 14; i++) {
                            newUri = newUri.replace(`文科教学楼_${i}.bin`, `teaching-building_${i}.bin`);
                            newUri = newUri.replace(new RegExp(`\\u6587\\u79d1\\u6559\\u5b66\\u697c_${i}\\.bin`, 'g'), `teaching-building_${i}.bin`);
                        }
                        
                        if (newUri !== buffer.uri) {
                            buffer.uri = newUri;
                            console.log(`已修改${file}的buffer[${index}]的uri: ${newUri}`);
                        }
                    }
                });
                
                // 保存修改后的文件
                const updatedContent = JSON.stringify(gltfData, null, 2);
                if (updatedContent !== content) {
                    fs.writeFileSync(filePath, updatedContent, 'utf8');
                    console.log(`已保存修改后的文件: ${file}`);
                }
            }
        } catch (error) {
            console.error(`处理文件${file}时出错: ${error.message}`);
        }
    }
});
console.log('所有.gltf文件修复完成！');
