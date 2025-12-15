// 等待页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    // 移除加载动画，使用CSS过渡效果
    setTimeout(() => {
        const loading = document.getElementById('loading');
        const mainWrapper = document.querySelector('.main-wrapper');
        
        // 添加淡出类
        loading.classList.add('fade-out');
        
        // 添加主内容淡入类
        mainWrapper.classList.add('fade-in');
        
        // 延迟后完全隐藏加载元素（与CSS过渡时间匹配）
        setTimeout(() => {
            loading.style.display = 'none';
        }, 1200);
    }, 1500);
    
    // 初始化图表
    initEnvChart();
    
    // 初始化数据更新
    initDataUpdates();
    
    // 初始化控制按钮
    initControls();
    
    // 初始化风向显示
    updateWindDisplay();
    
    // 更新时间显示
    updateTime();
    setInterval(updateTime, 1000);
    
    // 初始化模型控制按钮
    initModelControls();
    
    // 直接初始化Three.js场景，因为已经使用传统脚本加载
    console.log('开始初始化Three.js场景...');
    
    // 检查Three.js和GLTFLoader是否可用
    if (typeof THREE !== 'undefined') {
        console.log('Three.js已加载');
        if (typeof THREE.GLTFLoader !== 'undefined') {
            console.log('GLTFLoader已加载');
            initThreeJS();
            console.log('Three.js场景初始化完成');
        } else {
            console.error('GLTFLoader未加载');
            // 即使GLTFLoader未加载，也初始化基本场景
            initThreeJS();
        }
    } else {
        console.error('Three.js未加载');
    }
});

// Three.js相关变量
let scene, camera, renderer, controls;
let campusModel;
let autoRotate = false;
let isNightMode = false;
let ambientLight, mainLight;

function initThreeJS() {
    // 确保Three.js已加载
    if (!THREE) {
        console.error('Three.js未加载，无法初始化场景');
        return;
    }
    
    // 创建场景
    scene = new window.THREE.Scene();
    
    // 获取设备类型，用于移动端特殊处理
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 创建相机
    // 初始相机宽高比设为窗口宽高比
    camera = new window.THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 15000);
    
    // 移动端调整相机位置，更好地展示校园模型
    if (isMobile) {
        camera.position.set(40, 30, 40);
    } else {
        camera.position.set(30, 25, 30);
    }
    
    // 创建渲染器
    const canvasContainer = document.getElementById('canvas-container');
    
    // 确保canvas容器有正确的样式
    canvasContainer.style.width = '100%';
    canvasContainer.style.height = '100%';
    canvasContainer.style.position = 'relative';
    
    // 优化渲染器设置，减少渲染负担
    renderer = new window.THREE.WebGLRenderer({ 
        antialias: false, // 关闭抗锯齿，提高性能
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false, // 关闭模板缓冲
        depth: true // 保留深度缓冲
    });
    
    // 优化设备像素比，降低渲染分辨率
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5); // 限制像素比最大为1.5
    renderer.setPixelRatio(pixelRatio);
    
    // 设置渲染器尺寸
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 更新相机宽高比
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // 设置渲染器尺寸
    renderer.setSize(width, height);
    
    // 设置canvas容器尺寸
    canvasContainer.style.width = '100%';
    canvasContainer.style.height = '100vh';
    
    // 优化阴影设置，关闭阴影以提高性能
    renderer.shadowMap.enabled = false;
    
    // 添加渲染器到容器
    canvasContainer.appendChild(renderer.domElement);
    
    // 直接设置canvas元素的样式尺寸
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.display = 'block';
    canvas.style.margin = '0';
    canvas.style.padding = '0';
    canvas.style.border = 'none';
    canvas.style.outline = 'none';
    
    // 立即更新一次尺寸，确保正确
    setTimeout(() => {
        // 直接调用onWindowResize函数，而不是触发事件
        onWindowResize();
    }, 200);
    
    // 添加轨道控制，移动端优化灵敏度
    controls = new window.THREE.OrbitControls(camera, renderer.domElement);
    if (isMobile) {
        // 移动端降低旋转和缩放灵敏度
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 0.5;
        controls.panSpeed = 0.5;
        // 移动端启用触摸控制
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
    }
    
    // 添加灯光
    // 环境光 - 调整为更柔和的光线
    ambientLight = new window.THREE.AmbientLight(0x666666, 0.3);
    scene.add(ambientLight);
    
    // 半球光 - 模拟天空光效果
    const hemisphereLight = new window.THREE.HemisphereLight(0x87CEEB, 0x555555, 0.3);
    scene.add(hemisphereLight);
    
    // 主光源（模拟太阳，与天空中的太阳效果关联）
    mainLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(70, 120, 70);
    mainLight.castShadow = true;
    
    // 优化阴影参数
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 300;
    mainLight.shadow.camera.left = -150;
    mainLight.shadow.camera.right = 150;
    mainLight.shadow.camera.top = 150;
    mainLight.shadow.camera.bottom = -150;
    mainLight.shadow.bias = -0.0001;
    mainLight.shadow.radius = 2;
    
    scene.add(mainLight);
    
    // 存储主光源引用，用于后续更新
    scene.userData.mainLight = mainLight;
    
    // 添加辅助网格和坐标轴（开发时使用）
    // const gridHelper = new window.THREE.GridHelper(100, 100);
    // scene.add(gridHelper);
    // const axesHelper = new window.THREE.AxesHelper(20);
    // scene.add(axesHelper);
    
    // 创建校园建筑模型（只保留地面和地面网格）
    createCampusModel();
    
    // 创建天空
    createSky();
    
    // 加载文科教学楼GLTF模型
    loadTeachingBuildingModel();
    
    // 删除了天气粒子系统
    // 移除雾效果
    // scene.fog = new window.THREE.Fog(0x111c2e, 10, 150);
    
    // 窗口大小调整监听
    window.addEventListener('resize', onWindowResize);
    
    // 开始动画循环
    animate();
}

// 创建天空 - 使用简化的渐变天空，确保可靠显示
function createSky() {
    // 确保Three.js已加载
    if (!THREE) {
        console.error('Three.js未加载，无法创建天空');
        return;
    }
    
    // 移除场景背景色
    scene.background = null;
    
    // 创建天空对象
    const skyGeometry = new window.THREE.SphereGeometry(10000, 32, 32);
    const skyMaterial = new window.THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new window.THREE.Color(0x4a90e2) },
            bottomColor: { value: new window.THREE.Color(0x87ceeb) },
            sunPosition: { value: new window.THREE.Vector3() },
            nightTopColor: { value: new window.THREE.Color(0x000033) },
            nightBottomColor: { value: new window.THREE.Color(0x001122) },
            isNight: { value: isNightMode }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform vec3 sunPosition;
            uniform vec3 nightTopColor;
            uniform vec3 nightBottomColor;
            uniform bool isNight;
            
            varying vec3 vWorldPosition;
            
            void main() {
                vec3 worldNormal = normalize(vWorldPosition);
                float h = worldNormal.y;
                
                vec3 skyColor;
                if (isNight) {
                    // 夜间模式
                    skyColor = mix(nightBottomColor, nightTopColor, max(h, 0.0));
                } else {
                    // 白天模式
                    skyColor = mix(bottomColor, topColor, max(h, 0.0));
                    
                    // 添加太阳效果
                    vec3 sunDirection = normalize(sunPosition);
                    float sunAngle = dot(worldNormal, sunDirection);
                    if (sunAngle > 0.95) {
                        float sunSize = 0.05;
                        float sunFalloff = 0.1;
                        float sun = smoothstep(sunSize + sunFalloff, sunSize, sunAngle - 0.95);
                        skyColor += vec3(1.0, 0.9, 0.8) * sun * 2.0;
                    }
                }
                
                gl_FragColor = vec4(skyColor, 1.0);
            }
        `,
        side: window.THREE.BackSide
    });
    
    const sky = new window.THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // 存储天空对象，用于后续更新
    scene.userData.sky = sky;
    
    // 设置太阳位置
    const sunPosition = new window.THREE.Vector3(50, 100, 50).normalize().multiplyScalar(450000);
    skyMaterial.uniforms.sunPosition.value.copy(sunPosition);
    
    // 使用现有的mainLight作为太阳光源
    scene.userData.sunLight = mainLight;
    // 设置太阳光源的强度
    if (!isNightMode) {
        mainLight.intensity = 0.8;
    }
    
    // 创建月亮光源
    if (!scene.userData.moonLight) {
        const moonLight = new window.THREE.DirectionalLight(0xf0f0ff, 0.15);
        moonLight.position.set(-50, 80, -50);
        scene.add(moonLight);
        scene.userData.moonLight = moonLight;
    }
    
    // 确保场景背景色始终为null，避免被其他代码覆盖
    setTimeout(() => {
        scene.background = null;
    }, 100);
}

function createCampusModel() {
    // 确保Three.js已加载
    if (!window.THREE) {
        console.error('Three.js未加载，无法创建校园模型');
        return;
    }
    
    // 只保留地面和地面网格，删除其他所有模型
    // 地面
    const groundGeometry = new window.THREE.PlaneGeometry(200, 200);
    const groundMaterial = new window.THREE.MeshPhongMaterial({ 
        color: 0x2d5a8a,
        side: window.THREE.DoubleSide
    });
    const ground = new window.THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // 添加地面网格
    const groundGrid = new window.THREE.GridHelper(200, 50, 0x0a3a6a, 0x082a4a);
    groundGrid.position.y = 0.01;
    scene.add(groundGrid);
    
    // 删除了道路、环境和校门的创建，只保留地面和地面网格
}

function createBuilding(width, height, depth, color, type = 'generic') {
    // 确保Three.js已加载
    if (!THREE) {
        console.error('Three.js未加载，无法创建建筑模型');
        return new window.THREE.Group();
    }
    
    const buildingGroup = new window.THREE.Group();
    
    // 根据建筑类型创建不同的结构
    switch(type) {
        case 'teaching':
            createTeachingBuilding(buildingGroup, width, height, depth, color);
            break;
        case 'library':
            createLibraryBuilding(buildingGroup, width, height, depth, color);
            break;
        case 'lab':
            createLabBuilding(buildingGroup, width, height, depth, color);
            break;
        case 'dormitory':
            createDormitoryBuilding(buildingGroup, width, height, depth, color);
            break;
        case 'admin':
            createAdminBuilding(buildingGroup, width, height, depth, color);
            break;
        case 'gym':
            createGymBuilding(buildingGroup, width, height, depth, color);
            break;
        default:
            createGenericBuilding(buildingGroup, width, height, depth, color);
    }
    
    return buildingGroup;
}

// 创建通用建筑
function createGenericBuilding(group, width, height, depth, color) {
    // 确保Three.js已加载
    if (!THREE) {
        console.error('Three.js未加载，无法创建通用建筑');
        return;
    }
    
    // 主体建筑
    const mainGeometry = new window.THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new window.THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30,
        specular: 0xffffff
    });
    const mainBuilding = new window.THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    group.add(mainBuilding);
    
    // 屋顶
    const roofGeometry = new window.THREE.BoxGeometry(width + 0.5, 1, depth + 0.5);
    const roofMaterial = new window.THREE.MeshPhongMaterial({ 
        color: color - 0x111111,
        shininess: 20
    });
    const roof = new window.THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height / 2 + 0.5;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    // 添加窗户
    addWindows(group, width, height, depth);
    
    // 添加门
    addDoor(group, width, height, depth);
}

// 创建教学楼
function createTeachingBuilding(group, width, height, depth, color) {
    // 主教学楼通常有中央较高部分和两侧较低部分
    const centerHeight = height * 1.3;
    const wingWidth = width * 0.6;
    const wingDepth = depth * 0.8;
    
    // 中央部分
    const centerGeometry = new THREE.BoxGeometry(wingWidth, centerHeight, wingDepth);
    const centerMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30,
        specular: 0xffffff
    });
    const centerBuilding = new THREE.Mesh(centerGeometry, centerMaterial);
    centerBuilding.castShadow = true;
    centerBuilding.receiveShadow = true;
    group.add(centerBuilding);
    
    // 左右侧翼
    const wingGeometry = new THREE.BoxGeometry(wingWidth, height, wingDepth);
    const leftWing = new THREE.Mesh(wingGeometry, centerMaterial);
    leftWing.position.set(-width/2 + wingWidth/2, 0, 0);
    leftWing.castShadow = true;
    leftWing.receiveShadow = true;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, centerMaterial);
    rightWing.position.set(width/2 - wingWidth/2, 0, 0);
    rightWing.castShadow = true;
    rightWing.receiveShadow = true;
    group.add(rightWing);
    
    // 中央部分屋顶
    const centerRoofGeometry = new THREE.BoxGeometry(wingWidth + 1, 1.5, wingDepth + 1);
    const centerRoofMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8b0000,
        shininess: 20
    });
    const centerRoof = new THREE.Mesh(centerRoofGeometry, centerRoofMaterial);
    centerRoof.position.y = centerHeight / 2 + 0.75;
    centerRoof.castShadow = true;
    centerRoof.receiveShadow = true;
    group.add(centerRoof);
    
    // 侧翼屋顶
    const wingRoofGeometry = new THREE.BoxGeometry(wingWidth + 0.5, 1, wingDepth + 0.5);
    const wingRoofMaterial = new THREE.MeshPhongMaterial({ 
        color: color - 0x111111,
        shininess: 20
    });
    
    const leftRoof = new THREE.Mesh(wingRoofGeometry, wingRoofMaterial);
    leftRoof.position.set(-width/2 + wingWidth/2, height/2 + 0.5, 0);
    leftRoof.castShadow = true;
    leftRoof.receiveShadow = true;
    group.add(leftRoof);
    
    const rightRoof = new THREE.Mesh(wingRoofGeometry, wingRoofMaterial);
    rightRoof.position.set(width/2 - wingWidth/2, height/2 + 0.5, 0);
    rightRoof.castShadow = true;
    rightRoof.receiveShadow = true;
    group.add(rightRoof);
    
    // 添加窗户
    addWindows(group, wingWidth, centerHeight, wingDepth, 0, 0, 0); // 中央部分窗户
    addWindows(group, wingWidth, height, wingDepth, -width/2 + wingWidth/2, 0, 0); // 左侧翼窗户
    addWindows(group, wingWidth, height, wingDepth, width/2 - wingWidth/2, 0, 0); // 右侧翼窗户
    
    // 添加门
    addDoor(group, wingWidth, centerHeight, wingDepth, 0, 0, 0);
}

// 创建图书馆
function createLibraryBuilding(group, width, height, depth, color) {
    // 图书馆通常有较大的中央大厅和较高的外观
    const mainHeight = height * 1.2;
    const mainWidth = width * 0.8;
    const mainDepth = depth * 0.8;
    
    // 主体建筑
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30,
        specular: 0xffffff
    });
    const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    group.add(mainBuilding);
    
    // 图书馆特色：圆顶或特殊屋顶
    const domeGeometry = new THREE.CylinderGeometry(mainWidth/4, mainWidth/4, 3, 16);
    const domeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffff00,
        shininess: 40
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = mainHeight / 2 + 1.5;
    dome.castShadow = true;
    dome.receiveShadow = true;
    group.add(dome);
    
    // 屋顶平台
    const roofPlatformGeometry = new THREE.BoxGeometry(mainWidth + 1, 0.5, mainDepth + 1);
    const roofPlatformMaterial = new THREE.MeshPhongMaterial({ 
        color: color - 0x111111,
        shininess: 20
    });
    const roofPlatform = new THREE.Mesh(roofPlatformGeometry, roofPlatformMaterial);
    roofPlatform.position.y = mainHeight / 2 + 0.25;
    roofPlatform.castShadow = true;
    roofPlatform.receiveShadow = true;
    group.add(roofPlatform);
    
    // 两侧阅读室
    const readingRoomWidth = width * 0.2;
    const readingRoomHeight = height;
    const readingRoomDepth = depth;
    
    const readingRoomGeometry = new THREE.BoxGeometry(readingRoomWidth, readingRoomHeight, readingRoomDepth);
    
    const leftReadingRoom = new THREE.Mesh(readingRoomGeometry, mainMaterial);
    leftReadingRoom.position.set(-width/2 + readingRoomWidth/2, 0, 0);
    leftReadingRoom.castShadow = true;
    leftReadingRoom.receiveShadow = true;
    group.add(leftReadingRoom);
    
    const rightReadingRoom = new THREE.Mesh(readingRoomGeometry, mainMaterial);
    rightReadingRoom.position.set(width/2 - readingRoomWidth/2, 0, 0);
    rightReadingRoom.castShadow = true;
    rightReadingRoom.receiveShadow = true;
    group.add(rightReadingRoom);
    
    // 添加窗户
    addWindows(group, mainWidth, mainHeight, mainDepth, 0, 0, 0);
    addWindows(group, readingRoomWidth, readingRoomHeight, readingRoomDepth, -width/2 + readingRoomWidth/2, 0, 0);
    addWindows(group, readingRoomWidth, readingRoomHeight, readingRoomDepth, width/2 - readingRoomWidth/2, 0, 0);
    
    // 添加门
    addDoor(group, mainWidth, mainHeight, mainDepth, 0, 0, 0);
}

// 创建实验楼
function createLabBuilding(group, width, height, depth, color) {
    // 实验楼通常有多个实验室单元
    const unitWidth = width * 0.3;
    const unitHeight = height;
    const unitDepth = depth * 0.8;
    
    // 创建三个实验室单元
    for (let i = 0; i < 3; i++) {
        const xPos = -width/2 + unitWidth/2 + i * unitWidth + i * 0.5;
        
        const unitGeometry = new THREE.BoxGeometry(unitWidth, unitHeight, unitDepth);
        const unitMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 30,
            specular: 0xffffff
        });
        const unit = new THREE.Mesh(unitGeometry, unitMaterial);
        unit.position.set(xPos, 0, 0);
        unit.castShadow = true;
        unit.receiveShadow = true;
        group.add(unit);
        
        // 单元屋顶
        const unitRoofGeometry = new THREE.BoxGeometry(unitWidth + 0.3, 0.8, unitDepth + 0.3);
        const unitRoofMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4682b4,
            shininess: 20
        });
        const unitRoof = new THREE.Mesh(unitRoofGeometry, unitRoofMaterial);
        unitRoof.position.set(xPos, unitHeight/2 + 0.4, 0);
        unitRoof.castShadow = true;
        unitRoof.receiveShadow = true;
        group.add(unitRoof);
        
        // 实验室特色：通风管道
        const ventGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
        const ventMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const vent = new THREE.Mesh(ventGeometry, ventMaterial);
        vent.position.set(xPos, unitHeight/2 + 2, 0);
        vent.castShadow = true;
        vent.receiveShadow = true;
        group.add(vent);
        
        // 添加窗户
        addWindows(group, unitWidth, unitHeight, unitDepth, xPos, 0, 0);
        
        // 添加门
        if (i === 1) { // 中间单元添加门
            addDoor(group, unitWidth, unitHeight, unitDepth, xPos, 0, 0);
        }
    }
}

// 创建宿舍楼
function createDormitoryBuilding(group, width, height, depth, color) {
    // 宿舍楼通常有规律的房间布局和多个入口
    const floorHeight = 3;
    const numFloors = Math.floor(height / floorHeight);
    
    // 主体建筑
    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 25,
        specular: 0xffffff
    });
    const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    group.add(mainBuilding);
    
    // 屋顶
    const roofGeometry = new THREE.BoxGeometry(width + 0.5, 1, depth + 0.5);
    const roofMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8b0000,
        shininess: 20
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height / 2 + 0.5;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    // 宿舍楼特色：阳台
    const balconyGeometry = new THREE.BoxGeometry(width - 2, 0.2, depth + 1);
    const balconyMaterial = new THREE.MeshPhongMaterial({ 
        color: color - 0x222222,
        shininess: 20
    });
    
    for (let floor = 1; floor < numFloors; floor++) {
        const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
        balcony.position.set(0, -height/2 + floor * floorHeight + 0.1, 0);
        balcony.castShadow = true;
        balcony.receiveShadow = true;
        group.add(balcony);
    }
    
    // 添加多个门
    const doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.1);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    
    // 前门
    const frontDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    frontDoor.position.set(0, -height/2 + 1.25, depth/2 + 0.1);
    group.add(frontDoor);
    
    // 后门
    const backDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    backDoor.position.set(0, -height/2 + 1.25, -depth/2 - 0.1);
    group.add(backDoor);
    
    // 添加窗户
    addWindows(group, width, height, depth);
}

// 创建行政楼
function createAdminBuilding(group, width, height, depth, color) {
    // 行政楼通常外观正式，有对称结构
    const mainHeight = height * 1.1;
    const mainWidth = width * 0.7;
    const mainDepth = depth * 0.7;
    
    // 主体建筑
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 35,
        specular: 0xffffff
    });
    const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    group.add(mainBuilding);
    
    // 行政楼特色：柱廊
    const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, mainHeight - 5, 8);
    const columnMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffcc,
        shininess: 40
    });
    
    const columns = 4;
    const columnSpacing = mainWidth / (columns - 1);
    
    for (let i = 0; i < columns; i++) {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(-mainWidth/2 + i * columnSpacing, 0, mainDepth/2 + 0.1);
        column.castShadow = true;
        column.receiveShadow = true;
        group.add(column);
    }
    
    // 屋顶
    const roofGeometry = new THREE.BoxGeometry(mainWidth + 1, 1.2, mainDepth + 1);
    const roofMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8b0000,
        shininess: 20
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = mainHeight / 2 + 0.6;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    // 添加窗户
    addWindows(group, mainWidth, mainHeight, mainDepth, 0, 0, 0);
    
    // 添加门
    addDoor(group, mainWidth, mainHeight, mainDepth, 0, 0, 0);
}

// 创建体育馆
function createGymBuilding(group, width, height, depth, color) {
    // 体育馆通常有较大的跨度和独特的屋顶形状
    const mainWidth = width;
    const mainHeight = height;
    const mainDepth = depth;
    
    // 主体建筑（长方体）
    const mainGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
    const mainMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 25,
        specular: 0xffffff
    });
    const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    group.add(mainBuilding);
    
    // 体育馆特色：弧形屋顶
    const roofGeometry = new THREE.CylinderGeometry(mainWidth/2, mainWidth/2, height * 0.6, 16, 1, true);
    const roofMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4682b4,
        shininess: 20,
        side: THREE.DoubleSide
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.x = Math.PI / 2;
    roof.position.y = mainHeight / 2 + 0.5;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    // 添加大型入口
    const entranceGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.6, 0.5);
    const entranceMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        shininess: 20
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 0, depth/2 + 0.3);
    entrance.castShadow = true;
    entrance.receiveShadow = true;
    group.add(entrance);
    
    // 体育馆窗户较少，通常是高窗
    const windowGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.1);
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f8ff });
    
    const windowRows = 2;
    const windowCols = 6;
    const windowSpacingX = (mainWidth - 2) / (windowCols - 1);
    const windowSpacingY = (mainHeight - 6) / (windowRows - 1);
    
    for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
            // 前面窗户
            const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
            frontWindow.position.set(
                -mainWidth/2 + 1 + col * windowSpacingX,
                -mainHeight/2 + 3 + row * windowSpacingY,
                mainDepth/2 + 0.1
            );
            group.add(frontWindow);
            
            // 后面窗户
            const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
            backWindow.position.set(
                -mainWidth/2 + 1 + col * windowSpacingX,
                -mainHeight/2 + 3 + row * windowSpacingY,
                -mainDepth/2 - 0.1
            );
            group.add(backWindow);
        }
    }
}

// 添加窗户辅助函数
function addWindows(group, width, height, depth, offsetX = 0, offsetY = 0, offsetZ = 0) {
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f8ff });
    const windowGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.1);
    
    // 计算窗户数量
    const windowsPerRow = Math.max(2, Math.floor(width / 2));
    const windowRows = Math.max(2, Math.floor((height - 4) / 2));
    
    // 前面窗户
    for (let i = 0; i < windowsPerRow; i++) {
        for (let j = 0; j < windowRows; j++) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            const xPos = offsetX - width/2 + 1 + i * (width - 2) / (windowsPerRow - 1);
            const yPos = offsetY - height/2 + 2 + j * (height - 4) / (windowRows - 1);
            window.position.set(xPos, yPos, offsetZ + depth/2 + 0.1);
            group.add(window);
        }
    }
    
    // 后面窗户
    for (let i = 0; i < windowsPerRow; i++) {
        for (let j = 0; j < windowRows; j++) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            const xPos = offsetX - width/2 + 1 + i * (width - 2) / (windowsPerRow - 1);
            const yPos = offsetY - height/2 + 2 + j * (height - 4) / (windowRows - 1);
            window.position.set(xPos, yPos, offsetZ - depth/2 - 0.1);
            group.add(window);
        }
    }
    
    // 侧面窗户
    const sideWindowsPerRow = Math.max(2, Math.floor(depth / 2));
    for (let i = 0; i < sideWindowsPerRow; i++) {
        for (let j = 0; j < windowRows; j++) {
            // 左侧窗户
            const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
            const zPos = offsetZ - depth/2 + 1 + i * (depth - 2) / (sideWindowsPerRow - 1);
            const yPos = offsetY - height/2 + 2 + j * (height - 4) / (windowRows - 1);
            leftWindow.position.set(offsetX - width/2 - 0.1, yPos, zPos);
            group.add(leftWindow);
            
            // 右侧窗户
            const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
            rightWindow.position.set(offsetX + width/2 + 0.1, yPos, zPos);
            group.add(rightWindow);
        }
    }
}

// 添加门辅助函数
function addDoor(group, width, height, depth, offsetX = 0, offsetY = 0, offsetZ = 0) {
    const doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.1);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(offsetX, offsetY - height/2 + 1.25, offsetZ + depth/2 + 0.1);
    group.add(door);
}

// 加载文科教学楼GLTF模型 - 分块加载并组合
// 加载文科教学楼GLTF模型 - 分块加载并组合
function loadTeachingBuildingModel() {
    console.log('开始加载文科教学楼GLTF模型...');
    
    // 检查Three.js和GLTFLoader是否可用
    if (!window.THREE || !window.THREE.GLTFLoader) {
        console.error('Three.js或GLTF加载器未加载');
        return;
    }
    
    // 创建DRACOLoader实例 - 模型使用了DRACO压缩，必须提供
    const dracoLoader = new window.THREE.DRACOLoader();
    dracoLoader.setDecoderPath('./'); // 正确路径：draco文件在当前目录下
    
    // 创建GLTF加载器实例
    const loader = new window.THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader); // 关联DRACOLoader
    
    // 模型文件路径数组 - 所有建筑分块
    const modelPaths = [
        './gltf-models/teaching-building.gltf',
        './gltf-models/teaching-building_1.gltf',
        './gltf-models/teaching-building_2.gltf',
        './gltf-models/teaching-building_3.gltf',
        './gltf-models/teaching-building_4.gltf',
        './gltf-models/teaching-building_5.gltf',
        './gltf-models/teaching-building_6.gltf',
        './gltf-models/teaching-building_7.gltf',
        './gltf-models/teaching-building_8.gltf',
        './gltf-models/teaching-building_9.gltf',
        './gltf-models/teaching-building_10.gltf',
        './gltf-models/teaching-building_11.gltf',
        './gltf-models/teaching-building_12.gltf',
        './gltf-models/teaching-building_13.gltf',
        './gltf-models/teaching-building_14.gltf'
    ];
    
    // 创建主建筑组，用于组合所有分块
    const buildingGroup = new window.THREE.Group();
    buildingGroup.name = '文科教学楼';
    
    // 已加载分块计数器
    let loadedChunks = 0;
    
    // 优化：创建材质缓存，重用相同材质
    const materialCache = {};
    
    // 已失败分块计数器
    let failedChunks = 0;
    
    // 所有分块加载完成后的处理函数
    function handleAllChunksLoaded() {
        console.warn('部分分块加载失败，仍尝试组合建筑 (成功: ' + (loadedChunks - failedChunks) + '/' + modelPaths.length + ')');
        // 计算整个建筑的边界框（原始大小）
        const box = new window.THREE.Box3().setFromObject(buildingGroup);
        const size = box.getSize(new window.THREE.Vector3());
        console.log('建筑组合后原始大小:', size);
        
        // 计算原始中心位置
        const originalCenter = box.getCenter(new window.THREE.Vector3());
        console.log('建筑原始中心:', originalCenter);
        
        // 调整建筑大小，使其适合场景
        const maxSize = Math.max(size.x, size.y, size.z);
        const scaleFactor = 20 / maxSize; // 缩放至合适大小
        buildingGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);
        console.log('建筑缩放因子:', scaleFactor);
        
        // 调整建筑位置，使其位于场景中央
        // 先将模型平移到原点，然后应用缩放，再调整到合适位置
        buildingGroup.position.set(-originalCenter.x * scaleFactor, -originalCenter.y * scaleFactor, -originalCenter.z * scaleFactor);
        
        // 保存初始位置用于调试
        const initialY = buildingGroup.position.y;
        
        // 将模型向上偏移0.7个单位（根据需求）
        buildingGroup.position.y += 1.4;
        console.log('建筑位置调整:', { initialY: initialY, finalY: buildingGroup.position.y, offset: 0.7 });
        console.log('建筑最终位置:', buildingGroup.position);
        
        // 确保模型在相机视野范围内
        console.log('相机位置:', camera.position);
        console.log('相机看向:', controls.target);
        
        // 所有分块加载完成，添加到场景
        scene.add(buildingGroup);
        
        // 存储建筑引用
        scene.userData.teachingBuilding = buildingGroup;
        
        // 从后端获取模型数据并关联 - 仅在本地开发时尝试，GitHub Pages上会失败
        console.log('开始从后端获取完整模型数据...');
        fetch('http://localhost:5213/api/Model/building-data')
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                console.log('后端模型数据获取成功，开始关联到3D模型...');
                var modelPartsLength = data.modelParts ? data.modelParts.length : 0;
                var modelDatasLength = data.modelDatas ? data.modelDatas.length : 0;
                console.log('模型数据基本信息:', {
                    modelName: data.modelName,
                    version: data.version,
                    createdDate: data.createdDate,
                    partCount: modelPartsLength,
                    dataCount: modelDatasLength
                });
                
                // 将完整模型数据存储到模型对象中
                buildingGroup.userData.modelData = data;
                
                // 存储模型数据到模型的userData中，方便后续使用
                buildingGroup.userData.modelDatas = {};
                if (data.modelDatas && data.modelDatas.length > 0) {
                    // 初始化不同类型的数据存储
                    buildingGroup.userData.externalIds = {};
                    buildingGroup.userData.categories = {};
                    buildingGroup.userData.types = {};
                    
                    // 遍历所有模型数据，按类型存储
                    data.modelDatas.forEach(function(item) {
                        const dataKey = item.dataKey;
                        const externalId = item.externalId;
                        
                        // 根据DataType存储数据到相应的对象中
                        if (item.dataType === 'ExternalId') {
                            buildingGroup.userData.externalIds[dataKey] = externalId;
                        } else if (item.dataType === 'Category') {
                            buildingGroup.userData.categories[dataKey] = externalId;
                        } else if (item.dataType === 'Type') {
                            buildingGroup.userData.types[dataKey] = externalId;
                        }
                    });
                    
                    // 显示各类型数据的数量
                    console.log('已关联的数据数量:', {
                        externalIds: Object.keys(buildingGroup.userData.externalIds).length,
                        categories: Object.keys(buildingGroup.userData.categories).length,
                        types: Object.keys(buildingGroup.userData.types).length
                    });
                } else {
                    console.warn('模型数据为空，无法关联数据到3D模型');
                }
                
                console.log('完整模型数据已关联到3D模型');
            })
            .catch(function(error) {
                console.warn('从后端获取模型数据失败（仅在本地开发时可用）:', error);
                // 不影响模型显示，继续执行
            });
        
        console.log('文科教学楼分块加载并组合完成');
        console.log('模型已添加到场景，位置:', buildingGroup.position, '缩放:', buildingGroup.scale);
    }
    
    // 加载所有分块
    modelPaths.forEach(function(modelPath, index) {
        console.log('加载建筑分块 ' + (index + 1) + '/' + modelPaths.length + ': ' + modelPath);
        
        loader.load(
            modelPath,
            // 加载成功回调
            function(gltf) {
                loadedChunks++;
                console.log('分块加载成功 (' + loadedChunks + '/' + modelPaths.length + ')');
                
                const chunk = gltf.scene;
                chunk.name = 'building_chunk_' + index;
                
                // 处理分块，优化材质和渲染
                chunk.traverse(function(child) {
                    if (child.isMesh) {
                        // 优化性能：关闭阴影
                        child.castShadow = false;
                        child.receiveShadow = false;
                        
                        // 优化材质：重用相同材质，减少渲染状态切换
                        if (child.material) {
                            // 创建材质唯一标识
                            const materialKey = JSON.stringify({
                                color: child.material.color.getHex(),
                                roughness: child.material.roughness,
                                metalness: child.material.metalness,
                                shininess: child.material.shininess
                            });
                            
                            // 如果材质已存在，重用它
                            if (materialCache[materialKey]) {
                                child.material = materialCache[materialKey];
                            } else {
                                // 否则缓存该材质
                                materialCache[materialKey] = child.material;
                                // 优化材质参数
                                child.material.shininess = Math.min(child.material.shininess, 10);
                                child.material.specular = new window.THREE.Color(0x555555);
                            }
                            
                            // 优化几何体：合并相同几何体
                            child.geometry.computeVertexNormals();
                        }
                    }
                });
                
                // 将分块添加到主建筑组
                buildingGroup.add(chunk);
                console.log('分块已添加到建筑组 (' + loadedChunks + '/' + modelPaths.length + ')');
                
                // 检查是否所有分块都已加载完成
                if (loadedChunks === modelPaths.length) {
                    console.log('所有建筑分块加载完成 (成功: ' + (loadedChunks - failedChunks) + '/' + modelPaths.length + ')');
                    handleAllChunksLoaded();
                }
            },
            // 加载进度回调
            function(xhr) {
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    console.log('分块 ' + (index + 1) + ' 加载进度: ' + Math.round(percentComplete) + '%');
                }
            },
            // 加载错误回调 - 关键！用于调试模型加载问题
            function(error) {
                console.error('分块加载失败 ' + (index + 1) + '/' + modelPaths.length + ': ' + modelPath, error);
                // 即使某个分块加载失败，也要继续加载其他分块，避免整个模型无法显示
                loadedChunks++;
                failedChunks++;
                // 如果所有分块都已尝试加载（无论成功失败），仍然尝试组合建筑
                if (loadedChunks === modelPaths.length) {
                    handleAllChunksLoaded();
                }
            }
        );
    });
    
    // 添加模型加载超时检查
    setTimeout(function() {
        if (loadedChunks < modelPaths.length) {
            console.warn('模型加载超时警告: 已加载 ' + loadedChunks + '/' + modelPaths.length + ' 个分块，仍有 ' + (modelPaths.length - loadedChunks) + ' 个分块未加载完成');
        }
    }, 30000); // 30秒后检查
}

function createRoads() {
    // 道路材质 - 更真实的颜色和效果
    const mainRoadMaterial = new window.THREE.MeshPhongMaterial({ color: 0x222233, shininess: 15 });
    const secondaryRoadMaterial = new window.THREE.MeshPhongMaterial({ color: 0x333344, shininess: 10 });
    const lineMaterial = new window.THREE.MeshPhongMaterial({ color: 0xffff00, shininess: 40 });
    
    // 主路 - 更宽的主干道
    const mainRoad = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(12, 200),
        mainRoadMaterial
    );
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.y = 0.02;
    mainRoad.receiveShadow = true;
    scene.add(mainRoad);
    
    // 横向路 - 与主路宽度一致
    const crossRoad = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(200, 12),
        mainRoadMaterial
    );
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.y = 0.02;
    crossRoad.receiveShadow = true;
    scene.add(crossRoad);
    
    // 道路边缘线
    const edgeLineMaterial = new window.THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 });
    
    // 主路边缘线
    for (let side = -1; side <= 1; side += 2) {
        const edgeLine = new window.THREE.Mesh(
            new window.THREE.PlaneGeometry(0.2, 200),
            edgeLineMaterial
        );
        edgeLine.rotation.x = -Math.PI / 2;
        edgeLine.position.set(side * 6, 0.03, 0);
        scene.add(edgeLine);
    }
    
    // 横向路边缘线
    for (let side = -1; side <= 1; side += 2) {
        const edgeLine = new window.THREE.Mesh(
            new window.THREE.PlaneGeometry(200, 0.2),
            edgeLineMaterial
        );
        edgeLine.rotation.x = -Math.PI / 2;
        edgeLine.position.set(0, 0.03, side * 6);
        scene.add(edgeLine);
    }
    
    // 主路中心线 - 虚线
    for (let i = -95; i < 95; i += 15) {
        const centerLine = new window.THREE.Mesh(
            new window.THREE.PlaneGeometry(0.2, 10),
            lineMaterial
        );
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, 0.04, i);
        scene.add(centerLine);
    }
    
    // 横向路中心线 - 虚线
    for (let i = -95; i < 95; i += 15) {
        const centerLine = new window.THREE.Mesh(
            new window.THREE.PlaneGeometry(10, 0.2),
            lineMaterial
        );
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(i, 0.04, 0);
        scene.add(centerLine);
    }
    
    // 路口标记 - 停车线
    const stopLineMaterial = new window.THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 });
    
    // 主路停车线
    for (let side = -1; side <= 1; side += 2) {
        for (let i = -1; i <= 1; i += 1) {
            const stopLine = new window.THREE.Mesh(
                new window.THREE.PlaneGeometry(0.2, 12),
                stopLineMaterial
            );
            stopLine.rotation.x = -Math.PI / 2;
            stopLine.position.set(side * 8, 0.03, i * 8);
            scene.add(stopLine);
        }
    }
    
    // 横向路停车线
    for (let side = -1; side <= 1; side += 2) {
        for (let i = -1; i <= 1; i += 1) {
            const stopLine = new window.THREE.Mesh(
                new window.THREE.PlaneGeometry(12, 0.2),
                stopLineMaterial
            );
            stopLine.rotation.x = -Math.PI / 2;
            stopLine.position.set(i * 8, 0.03, side * 8);
            scene.add(stopLine);
        }
    }
    
    // 校园内道路 - 连接各个建筑的小路
    const pathMaterial = new window.THREE.MeshPhongMaterial({ color: 0x555555, shininess: 5 });
    
    // 连接主教学楼和行政楼的小路
    const path1 = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(3, 15),
        pathMaterial
    );
    path1.rotation.x = -Math.PI / 2;
    path1.position.set(-10, 0.02, 10);
    scene.add(path1);
    
    // 连接图书馆和实验楼的小路
    const path2 = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(3, 25),
        pathMaterial
    );
    path2.rotation.x = -Math.PI / 2;
    path2.position.set(-5, 0.02, -15);
    scene.add(path2);
    
    // 连接宿舍楼和体育馆的小路
    const path3 = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(3, 30),
        pathMaterial
    );
    path3.rotation.x = -Math.PI / 2;
    path3.position.set(12, 0.02, 0);
    scene.add(path3);
}

function createEnvironment() {
    // 创建树木
    const trunkMaterial = new window.THREE.MeshPhongMaterial({ color: 0x8b4513 });
    
    // 增加更多树木位置和类型，优化分布
    const treePositions = [
        // 东南部
        {x: 30, z: 30, type: 0}, {x: 40, z: 25, type: 1}, {x: 35, z: 40, type: 2},
        {x: 25, z: 20, type: 1}, {x: 38, z: 35, type: 0}, {x: 45, z: 30, type: 2},
        
        // 西北部
        {x: -30, z: -30, type: 1}, {x: -40, z: -25, type: 0}, {x: -35, z: -40, type: 2},
        {x: -25, z: -20, type: 0}, {x: -38, z: -35, type: 1}, {x: -45, z: -30, type: 2},
        
        // 东北部
        {x: 30, z: -30, type: 2}, {x: 40, z: -35, type: 0}, {x: 35, z: -40, type: 1},
        {x: 25, z: -20, type: 0}, {x: 38, z: -35, type: 2}, {x: 45, z: -30, type: 1},
        
        // 西南部
        {x: -30, z: 30, type: 1}, {x: -40, z: 35, type: 2}, {x: -35, z: 40, type: 0},
        {x: -25, z: 20, type: 2}, {x: -38, z: 35, type: 0}, {x: -45, z: 30, type: 1},
        
        // 中部周围
        {x: 15, z: 35, type: 0}, {x: -15, z: -35, type: 1}, {x: 20, z: -25, type: 2},
        {x: -20, z: 25, type: 0}, {x: 50, z: 15, type: 1}, {x: -50, z: -15, type: 2},
        {x: 50, z: -15, type: 0}, {x: -50, z: 15, type: 1}, {x: 15, z: -35, type: 2},
        {x: -15, z: 35, type: 0}, {x: 25, z: 10, type: 1}, {x: -25, z: -10, type: 2},
        {x: 25, z: -10, type: 0}, {x: -25, z: 10, type: 1}, {x: 10, z: 25, type: 2},
        {x: -10, z: -25, type: 0}, {x: 10, z: -25, type: 1}, {x: -10, z: 25, type: 2}
    ];
    
    treePositions.forEach(pos => {
        createTree(pos.x, pos.z, pos.type);
    });
    
    // 增加更多灌木丛，优化分布
    for (let i = 0; i < 50; i++) {
        // 确保灌木丛分布在树木周围，避免在道路上
        const x = Math.random() * 90 - 45;
        const z = Math.random() * 90 - 45;
        
        // 避免在道路中央
        if (Math.abs(x) > 8 || Math.abs(z) > 8) {
            createBush(x, z);
        }
    }
    
    // 创建路灯
    const lampPositions = [
        {x: -50, z: 0}, {x: 50, z: 0}, {x: 0, z: 50}, {x: 0, z: -50},
        {x: 30, z: 30}, {x: -30, z: -30}, {x: 30, z: -30}, {x: -30, z: 30},
        {x: -20, z: 0}, {x: 20, z: 0}, {x: 0, z: 20}, {x: 0, z: -20},
        {x: 15, z: 15}, {x: -15, z: -15}, {x: 15, z: -15}, {x: -15, z: 15}
    ];
    
    lampPositions.forEach(pos => {
        createStreetLamp(pos.x, pos.z);
    });
}

// 创建多样化的树木
function createTree(x, z, type = 0) {
    const trunkMaterial = new window.THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const trunkHeight = 3 + Math.random() * 2;
    const trunkRadius = 0.4 + Math.random() * 0.2;
    
    // 树干
    const trunkGeometry = new window.THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.1, trunkHeight);
    const trunk = new window.THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, trunkHeight / 2, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    // 树冠
    const treeGroup = new window.THREE.Group();
    treeGroup.position.set(x, trunkHeight, z);
    
    switch(type) {
        case 0: // 松树型
            const coneMaterial = new window.THREE.MeshPhongMaterial({ color: 0x2d5a27, shininess: 10 });
            const coneCount = 3;
            
            for (let i = 0; i < coneCount; i++) {
                const coneRadius = 3 - i * 0.5 + Math.random() * 0.5;
                const coneHeight = 2 + Math.random() * 0.5;
                const coneGeometry = new window.THREE.ConeGeometry(coneRadius, coneHeight, 8);
                const cone = new window.THREE.Mesh(coneGeometry, coneMaterial);
                cone.position.y = -i * (coneHeight * 0.6) + coneHeight / 2;
                cone.castShadow = true;
                cone.receiveShadow = true;
                treeGroup.add(cone);
            }
            break;
            
        case 1: // 球形
            const sphereMaterial = new window.THREE.MeshPhongMaterial({ color: 0x228B22, shininess: 20 });
            const sphereCount = 4 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < sphereCount; i++) {
                const sphereRadius = 1.5 + Math.random() * 0.5;
                const sphereGeometry = new window.THREE.SphereGeometry(sphereRadius, 8, 8);
                const sphere = new window.THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.set(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                );
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                treeGroup.add(sphere);
            }
            break;
            
        case 2: // 混合型
            const mixMaterial1 = new window.THREE.MeshPhongMaterial({ color: 0x32CD32, shininess: 15 });
            const mixMaterial2 = new window.THREE.MeshPhongMaterial({ color: 0x20B2AA, shininess: 10 });
            
            // 底部大圆锥
            const bottomConeGeometry = new window.THREE.ConeGeometry(3, 4, 8);
            const bottomCone = new window.THREE.Mesh(bottomConeGeometry, mixMaterial1);
            bottomCone.position.y = -1;
            bottomCone.castShadow = true;
            bottomCone.receiveShadow = true;
            treeGroup.add(bottomCone);
            
            // 顶部小球
            const topSphereGeometry = new window.THREE.SphereGeometry(1.5, 8, 8);
            const topSphere = new window.THREE.Mesh(topSphereGeometry, mixMaterial2);
            topSphere.position.y = 1;
            topSphere.castShadow = true;
            topSphere.receiveShadow = true;
            treeGroup.add(topSphere);
            break;
    }
    
    scene.add(treeGroup);
}

// 创建灌木丛
function createBush(x, z) {
    const bushMaterial = new window.THREE.MeshPhongMaterial({ color: 0x32CD32, shininess: 5 });
    const bushCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < bushCount; i++) {
        const bushRadius = 0.8 + Math.random() * 0.5;
        const bushGeometry = new window.THREE.SphereGeometry(bushRadius, 6, 6);
        const bush = new window.THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(
            x + (Math.random() - 0.5) * 2,
            bushRadius,
            z + (Math.random() - 0.5) * 2
        );
        bush.castShadow = true;
        bush.receiveShadow = true;
        scene.add(bush);
    }
}

function createWeatherSystems() {
    const rainCount = 1500;
    const rainGeometry = new window.THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
        rainPositions[i] = Math.random() * 200 - 100;
        rainPositions[i + 1] = Math.random() * 80;
        rainPositions[i + 2] = Math.random() * 200 - 100;
    }
    rainGeometry.setAttribute('position', new window.THREE.BufferAttribute(rainPositions, 3));
    const rainMaterial = new window.THREE.PointsMaterial({
        color: 0x77aaff,
        size: 0.15,
        transparent: true,
        opacity: 0.6
    });
    rainSystem = new window.THREE.Points(rainGeometry, rainMaterial);
    rainSystem.visible = false;
    scene.add(rainSystem);
    
    const snowCount = 1200;
    const snowGeometry = new window.THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
        snowPositions[i] = Math.random() * 200 - 100;
        snowPositions[i + 1] = Math.random() * 80;
        snowPositions[i + 2] = Math.random() * 200 - 100;
    }
    snowGeometry.setAttribute('position', new window.THREE.BufferAttribute(snowPositions, 3));
    const snowMaterial = new window.THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.25,
        transparent: true,
        opacity: 0.8
    });
    snowSystem = new window.THREE.Points(snowGeometry, snowMaterial);
    snowSystem.visible = false;
    scene.add(snowSystem);
}

function createStreetLamp(x, z) {
    // 灯柱
    const poleGeometry = new window.THREE.CylinderGeometry(0.2, 0.3, 8);
    const poleMaterial = new window.THREE.MeshPhongMaterial({ color: 0x555555 });
    const pole = new window.THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 4, z);
    scene.add(pole);
    
    // 灯罩
    const lampGeometry = new window.THREE.SphereGeometry(0.8, 8, 8);
    const lampMaterial = new window.THREE.MeshBasicMaterial({ 
        color: 0xffffcc,
        transparent: true,
        opacity: 0.8
    });
    const lamp = new window.THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(x, 8, z);
    scene.add(lamp);
    
    // 灯光
    const light = new window.THREE.PointLight(0xffffcc, 0.8, 20);
    light.position.set(x, 7, z);
    scene.add(light);
}

function createCampusGate() {
    // 校门材质
    const pillarMaterial = new window.THREE.MeshPhongMaterial({ color: 0x8b7355 });
    const metalMaterial = new window.THREE.MeshPhongMaterial({ color: 0x4a4a4a, shininess: 50 });
    const stoneMaterial = new window.THREE.MeshPhongMaterial({ color: 0x654321, shininess: 10 });
    const signMaterial = new window.THREE.MeshPhongMaterial({ color: 0x2a6fa5, shininess: 20 });
    const goldMaterial = new window.THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 60 });
    
    // 左侧门柱（带装饰）
    const leftPillar = new window.THREE.Group();
    
    // 主柱体
    const mainPillar = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(1.8, 9, 1.8),
        pillarMaterial
    );
    mainPillar.position.y = 4.5;
    leftPillar.add(mainPillar);
    
    // 顶部装饰
    const topDecor = new window.THREE.Mesh(
        new window.THREE.CylinderGeometry(1.2, 0.8, 2, 8),
        metalMaterial
    );
    topDecor.position.y = 10;
    leftPillar.add(topDecor);
    
    // 底部基座
    const base = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(2.5, 1, 2.5),
        stoneMaterial
    );
    base.position.y = 0.5;
    leftPillar.add(base);
    
    // 装饰条纹
    for (let i = 0; i < 3; i++) {
        const stripe = new window.THREE.Mesh(
            new window.THREE.BoxGeometry(2.2, 0.3, 2.2),
            metalMaterial
        );
        stripe.position.y = 2 + i * 2.5;
        leftPillar.add(stripe);
    }
    
    leftPillar.position.set(-14, 0, -40);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    scene.add(leftPillar);
    
    // 右侧门柱
    const rightPillar = leftPillar.clone();
    rightPillar.position.set(14, 0, -40);
    scene.add(rightPillar);
    
    // 门楣（改进设计）
    const lintelGroup = new window.THREE.Group();
    
    // 主横梁
    const mainLintel = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(32, 1.2, 1.5),
        pillarMaterial
    );
    mainLintel.position.y = 0.6;
    lintelGroup.add(mainLintel);
    
    // 顶部装饰梁
    const topLintel = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(34, 0.8, 1),
        metalMaterial
    );
    topLintel.position.y = 2;
    lintelGroup.add(topLintel);
    
    // 装饰球体
    for (let i = -2; i <= 2; i++) {
        const ball = new window.THREE.Mesh(
            new window.THREE.SphereGeometry(0.6, 8, 8),
            goldMaterial
        );
        ball.position.set(i * 5, 1.2, 0);
        lintelGroup.add(ball);
    }
    
    lintelGroup.position.set(0, 9, -40);
    lintelGroup.castShadow = true;
    lintelGroup.receiveShadow = true;
    scene.add(lintelGroup);
    
    // 校名牌子（改进设计）
    const signGroup = new window.THREE.Group();
    
    // 牌子底座
    const signBase = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(12, 3, 0.6),
        signMaterial
    );
    signBase.position.set(0, 0, 0);
    signGroup.add(signBase);
    
    // 校名文字边框（简化表示）
    const textBorder = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(10, 1.5, 0.8),
        goldMaterial
    );
    textBorder.position.set(0, 0, 0.4);
    signGroup.add(textBorder);
    
    // 两侧装饰
    const leftOrnament = new window.THREE.Mesh(
        new window.THREE.CylinderGeometry(0.5, 0.3, 2, 6),
        goldMaterial
    );
    leftOrnament.rotation.z = Math.PI / 2;
    leftOrnament.position.set(-6.5, 0, 0);
    signGroup.add(leftOrnament);
    
    const rightOrnament = leftOrnament.clone();
    rightOrnament.position.set(6.5, 0, 0);
    signGroup.add(rightOrnament);
    
    signGroup.position.set(0, 6, -40);
    signGroup.castShadow = true;
    signGroup.receiveShadow = true;
    scene.add(signGroup);
    
    // 校门灯光
    const leftLight = new window.THREE.SpotLight(0xffffcc, 1.5, 20);
    leftLight.position.set(-12, 8, -35);
    leftLight.target.position.set(0, 0, -40);
    leftLight.castShadow = true;
    scene.add(leftLight);
    
    const rightLight = new window.THREE.SpotLight(0xffffcc, 1.5, 20);
    rightLight.position.set(12, 8, -35);
    rightLight.target.position.set(0, 0, -40);
    rightLight.castShadow = true;
    scene.add(rightLight);
    
    // 校门入口道路
    const entranceRoad = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(30, 15),
        new window.THREE.MeshPhongMaterial({ color: 0x222233 })
    );
    entranceRoad.rotation.x = -Math.PI / 2;
    entranceRoad.position.set(0, 0.03, -47.5);
    scene.add(entranceRoad);
    
    // 道路中心线
    const centerLine = new window.THREE.Mesh(
        new window.THREE.PlaneGeometry(0.8, 15),
        new window.THREE.MeshPhongMaterial({ color: 0xffff00 })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.04, -47.5);
    scene.add(centerLine);
}

function onWindowResize() {
    // 使用更可靠的方式获取窗口尺寸
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 确保尺寸不为零
    if (width === 0 || height === 0) {
        return;
    }
    
    // 更新相机宽高比
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // 更新渲染器尺寸，使用setPixelRatio确保高清显示
    const pixelRatio = window.devicePixelRatio || 1;
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    
    // 直接设置canvas元素的样式尺寸为100%，确保它填充整个容器
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // 更新图表
    if (window.envChart) window.envChart.resize();
    if (window.trafficBarChart) window.trafficBarChart.resize();
    if (window.parkingChart) window.parkingChart.resize();
    if (window.windTrendChart) window.windTrendChart.resize();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (autoRotate) {
        scene.rotation.y += 0.002;
    }
    
    if (rainSystem && rainSystem.visible) {
        const positions = rainSystem.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            let y = positions.getY(i) - 0.8;
            if (y < -5) {
                y = 80;
            }
            positions.setY(i, y);
        }
        positions.needsUpdate = true;
    }
    
    if (snowSystem && snowSystem.visible) {
        const positions = snowSystem.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            let y = positions.getY(i) - 0.25;
            if (y < -5) {
                y = 80;
            }
            positions.setY(i, y);
        }
        positions.needsUpdate = true;
    }
    
    // 只有当controls存在时才更新
    if (controls) {
        controls.update();
    }
    renderer.render(scene, camera);
}

// 图表与天气状态
let envChart, energyBarChart, windTrendChart;
let weatherMode = 'sunny';
let rainSystem, snowSystem;
// 风向数据
let windData = {
    direction: "东北",
    degree: 45,
    desc: "东北风",
    trend: []
};

// 优化的图表初始化，特别是区域环境监测图表
function initEnvChart() {
    console.log('开始初始化图表...');
    
    // 确保Chart.js加载完成
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载，1秒后重试...');
        setTimeout(initEnvChart, 1000);
        return;
    }
    
    try {
        // 区域环境监测图表 - 多数据集线图，显示气温、风力、湿度
        const ctx = document.getElementById('env-chart').getContext('2d');
        const labels = Array.from({ length: 20 }, (_, i) => `${i + 1}`);
        const baseTemp = 23.5;
        const baseWind = 3.2;
        const baseHum = 65;
        
        // 生成更真实的数据波动
        const generateData = (base, variance) => {
            return labels.map(() => base + (Math.random() - 0.5) * variance);
        };
        
        window.envChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '气温',
                        data: generateData(baseTemp, 2),
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#ff6b6b',
                        borderDash: []
                    },
                    {
                        label: '风力',
                        data: generateData(baseWind, 1.5),
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#4ecdc4',
                        borderDash: [5, 5]
                    },
                    {
                        label: '湿度',
                        data: generateData(baseHum, 10),
                        borderColor: '#45b7d1',
                        backgroundColor: 'rgba(69, 183, 209, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#45b7d1',
                        borderDash: [3, 3]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#8ac7ff',
                            font: { size: 9 },
                            padding: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 40, 70, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#a0cfff',
                        borderColor: 'rgba(100, 180, 255, 0.6)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (label.includes('气温')) {
                                        label += context.parsed.y.toFixed(1) + '°C';
                                    } else if (label.includes('风力')) {
                                        label += context.parsed.y.toFixed(1) + ' m/s';
                                    } else if (label.includes('湿度')) {
                                        label += context.parsed.y.toFixed(0) + '%';
                                    } else {
                                        label += context.parsed.y;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 150, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8ac7ff',
                            font: {
                                size: 9
                            },
                            maxTicksLimit: 5,
                            callback: function(value) {
                                // 根据不同数据集显示不同单位
                                if (Math.abs(value - baseTemp) < 10) {
                                    return value + '°C';
                                } else if (Math.abs(value - baseWind) < 5) {
                                    return value + ' m/s';
                                } else {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8ac7ff',
                            font: {
                                size: 8
                            },
                            maxTicksLimit: 10,
                            autoSkip: true,
                            callback: function(value) {
                                return value + ':00';
                            }
                        },
                        title: {
                            display: true,
                            text: '时间',
                            color: '#8ac7ff',
                            font: { size: 8 }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
        
        console.log('env-chart初始化成功，多数据集线图');
    } catch (error) {
        console.error('env-chart初始化失败:', error.message);
        return;
    }
    
    try {
        // 交通拥堵指数柱状图
        const trafficCtx = document.getElementById('traffic-bar-chart').getContext('2d');
        const trafficLabels = ['校门', '图书馆', '教学楼', '食堂', '宿舍区', '体育馆', '实验楼'];
        const baseTraffic = 50;
        
        // 生成交通拥堵指数数据（0-100，值越大越拥堵）
        const generateTrafficData = (base, variance) => {
            return trafficLabels.map(() => {
                // 生成0-100的随机值，模拟交通拥堵指数
                return Math.round((base + (Math.random() - 0.5) * variance));
            });
        };
        
        window.trafficBarChart = new Chart(trafficCtx, {
            type: 'bar',
            data: {
                labels: trafficLabels,
                datasets: [{
                    label: '拥堵指数',
                    data: generateTrafficData(baseTraffic, 30),
                    backgroundColor: 'rgba(100, 200, 255, 0.6)',
                    borderColor: '#64c8ff',
                    borderWidth: 1,
                    borderRadius: 6,
                    hoverBackgroundColor: 'rgba(100, 200, 255, 0.8)',
                    hoverBorderColor: '#4a90e2',
                    barThickness: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 40, 70, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#a0cfff',
                        borderColor: 'rgba(100, 180, 255, 0.6)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return `拥堵指数: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 150, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8ac7ff',
                            font: { size: 10 },
                            maxTicksLimit: 5
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8ac7ff',
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
        console.log('traffic-bar-chart初始化成功');
    } catch (error) {
        console.error('traffic-bar-chart初始化失败:', error.message);
    }
    
    // parking-chart元素未在HTML中定义，跳过初始化
    window.parkingChart = null;
    console.log('parking-chart元素未在HTML中定义，跳过初始化');
    
    try {
        // 风向变化趋势图表
        const windCtx = document.getElementById('wind-trend-chart').getContext('2d');
        const windLabels = ['0', '5', '10', '15', '20', '25', '30'];
        
        // 生成真实风向变化数据
        const generateWindTrendData = () => {
            return windLabels.map(() => {
                // 生成0-360度的风向角度
                return Math.round(Math.random() * 360);
            });
        };
        
        window.windTrendChart = new Chart(windCtx, {
            type: 'line',
            data: {
                labels: windLabels,
                datasets: [{
                    label: '风向变化',
                    data: generateWindTrendData(),
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#4ecdc4'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 40, 70, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#a0cfff',
                        borderColor: 'rgba(100, 180, 255, 0.6)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return `风向: ${context.parsed.y}°`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 360,
                        grid: {
                            color: 'rgba(0, 150, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8ac7ff',
                            font: { size: 9 },
                            maxTicksLimit: 6,
                            callback: function(value) {
                                return value + '°';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#8ac7ff',
                            font: { size: 9 }
                        },
                        title: {
                            display: true,
                            text: '分钟',
                            color: '#8ac7ff',
                            font: { size: 8 }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
        console.log('wind-trend-chart初始化成功');
    } catch (error) {
        console.error('wind-trend-chart初始化失败:', error.message);
    }
}

function updateEnvChart(temp, wind, humidity) {
    if (!window.envChart) {
        console.error('envChart未初始化，无法更新');
        return;
    }
    
    try {
        const { datasets, labels } = window.envChart.data;
        labels.push(`${labels.length + 1}`);
        labels.shift();
        
        // 更新气温数据
        if (datasets[0]) {
            datasets[0].data.push(temp);
            datasets[0].data.shift();
        }
        
        // 更新风力数据
        if (datasets[1]) {
            datasets[1].data.push(wind);
            datasets[1].data.shift();
        }
        
        // 更新湿度数据
        if (datasets[2]) {
            datasets[2].data.push(humidity);
            datasets[2].data.shift();
        }
        
        // 更新图表
        window.envChart.update('none');
    } catch (error) {
        console.error('更新envChart失败:', error.message);
    }
}

function updateTrafficChart() {
    if (!window.trafficBarChart) {
        console.error('trafficBarChart未初始化，无法更新');
        return;
    }
    
    try {
        const { datasets, labels } = window.trafficBarChart.data;
        const baseTraffic = 50;
        const variance = 30;
        
        // 生成新的交通拥堵指数数据
        datasets[0].data = labels.map(() => {
            // 生成0-100的随机值，模拟交通拥堵指数
            return Math.round((baseTraffic + (Math.random() - 0.5) * variance));
        });
        
        // 更新图表
        window.trafficBarChart.update('none');
    } catch (error) {
        console.error('更新trafficBarChart失败:', error.message);
    }
}

// 更新校园周边环境数据
function updateAmbientEnvironment() {
    // 从天气数据中获取环境信息，或者使用模拟数据
    const temp = parseFloat(document.getElementById('hud-temp').textContent);
    const humidity = parseFloat(document.getElementById('hud-humidity').textContent);
    
    // 生成空气质量数据（优、良、轻度污染、中度污染、重度污染、严重污染）
    const airQualityLevels = ['优', '良', '轻度污染', '中度污染', '重度污染', '严重污染'];
    const airQualityIndex = Math.floor(Math.random() * 6);
    const airQuality = airQualityLevels[airQualityIndex];
    
    // 根据空气质量指数设置空气质量值
    const airQualityValue = airQualityIndex * 20 + Math.round(Math.random() * 20);
    
    // 生成PM2.5数据（0-500）
    const pm25 = Math.round(Math.random() * 100);
    
    // 更新空气质量
    document.getElementById('air-quality').textContent = airQuality;
    document.getElementById('air-quality-bar').style.width = `${Math.max(0, Math.min(100, 100 - airQualityValue))}%`;
    
    // 更新PM2.5
    document.getElementById('pm25').textContent = pm25;
    document.getElementById('pm25-bar').style.width = `${Math.max(0, Math.min(100, pm25 / 5))}%`;
    
    // 更新温度
    document.getElementById('ambient-temp').textContent = `${temp.toFixed(1)}°C`;
    document.getElementById('temp-bar').style.width = `${Math.max(0, Math.min(100, (temp - 5) / 35 * 100))}%`;
    
    // 更新湿度
    document.getElementById('ambient-humidity').textContent = `${humidity}%`;
    document.getElementById('humidity-bar').style.width = `${humidity}%`;
}

function updateParkingChart() {
    if (!window.parkingChart) {
        console.error('parkingChart未初始化，无法更新');
        return;
    }
    
    try {
        const { datasets, labels } = window.parkingChart.data;
        const base = 25;
        const variance = 15;
        
        // 生成新的车流量数据（考虑一天中的时间变化）
        datasets[0].data = labels.map((label, index) => {
            // 解析小时数
            const hour = parseInt(label.split(':')[0]);
            
            // 不同时间段的车流量变化
            let timeFactor = 1;
            if (hour >= 8 && hour <= 9) {
                timeFactor = 1.5; // 早高峰
            } else if (hour >= 12 && hour <= 13) {
                timeFactor = 1.2; // 中午高峰
            } else if (hour >= 17 && hour <= 18) {
                timeFactor = 1.6; // 晚高峰
            } else if (hour >= 20 || hour <= 6) {
                timeFactor = 0.5; // 夜间车流量少
            }
            
            return Math.round((base + (Math.random() - 0.5) * variance) * timeFactor);
        });
        
        // 更新图表
        window.parkingChart.update('none');
    } catch (error) {
        console.error('更新parkingChart失败:', error.message);
    }
}









// 使用高德地图API获取天气数据
function fetchWeatherData() {
    console.log('=== 开始获取天气数据 ===');
    
    // 使用用户提供的高德地图API密钥
    const apiKey = 'c63029c4fc7017f7f3ffc7c96d4f6b54';
    const cityCode = '410103'; // 河南省郑州市二七区的城市代码
    
    // 高德地图天气API请求URL
    // 使用JSONP解决CORS问题
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?city=${cityCode}&key=${apiKey}&output=JSON&callback=window.handleWeatherData`;
    
    console.log('天气API请求URL:', url);
    
    // 创建script标签进行JSONP请求
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.id = 'weatherScript';
    
    // 添加超时机制，5秒后如果没有响应则使用模拟数据
    const timeoutId = setTimeout(function() {
        console.error('⚠️ 天气API请求超时，使用模拟数据');
        useMockWeatherData();
        if (document.getElementById('weatherScript')) {
            document.head.removeChild(document.getElementById('weatherScript'));
        }
    }, 5000);
    
    // 添加到页面
    document.head.appendChild(script);
    
    // 延迟移除script标签，确保回调函数执行
    setTimeout(function() {
        if (document.getElementById('weatherScript')) {
            document.head.removeChild(document.getElementById('weatherScript'));
        }
        clearTimeout(timeoutId); // 清除超时计时器
        console.log('天气API请求处理完成');
    }, 1000);
    
    script.onerror = function() {
        console.error('❌ 天气API请求失败，使用模拟数据');
        useMockWeatherData();
        if (document.getElementById('weatherScript')) {
            document.head.removeChild(document.getElementById('weatherScript'));
        }
        clearTimeout(timeoutId); // 清除超时计时器
    };
}

// JSONP回调函数，处理高德地图天气API返回的数据
window.handleWeatherData = function(data) {
    console.log('=== 天气API响应数据 ===');
    console.log('原始响应:', data);
    
    if (data.status === '1') {
        if (data.lives && data.lives.length > 0) {
            const weatherData = data.lives[0];
            
            console.log('✅ 天气数据获取成功:', weatherData);
            
            // 更新温度
            const temp = parseFloat(weatherData.temperature);
            console.log('🌡️ 更新温度:', temp);
            document.getElementById('hud-temp').textContent = `${temp.toFixed(1)}°C`;
            document.getElementById('env-temp').textContent = `${temp.toFixed(1)}°C`;
            
            // 更新风力
            let windPower = weatherData.windpower;
            console.log('💨 更新风力等级:', windPower);
            
            // 处理风力等级格式，如"≤3"转换为"3"
            const windPowerNum = parseFloat(windPower) || 0;
            
            // 使用优化的风力显示函数
            const windDisplay = formatWindDisplay(windPowerNum);
            
            document.getElementById('hud-wind').innerHTML = `${windDisplay.icon} ${windDisplay.level}`;
            document.getElementById('env-wind').innerHTML = `${windDisplay.icon} ${windDisplay.level}`;
            
            // 更新湿度
            const humidity = parseInt(weatherData.humidity);
            console.log('💧 更新湿度:', humidity);
            document.getElementById('hud-humidity').textContent = `${humidity}%`;
            document.getElementById('env-hum').textContent = `${humidity}%`;
            
            // 更新天气状态
            const weather = weatherData.weather;
            console.log('🌤️ 更新天气状态:', weather);
            document.getElementById('weather-mode').textContent = weather;
            
            // 更新空气质量
            let airQuality = humidity > 80 ? '良' : temp > 35 ? '轻度污染' : '优';
            console.log('🌫️ 更新空气质量:', airQuality);
            document.getElementById('hud-air-quality').textContent = airQuality;
            
            // 根据实时天气数据更新场景天气效果
            setWeatherMode(weather, temp, humidity, windPowerNum);
            
            // 更新空气质量
            airQuality = weatherData.airquality || airQuality;
            console.log('🌬️ 更新空气质量:', airQuality);
            document.getElementById('env-air').textContent = airQuality;
            
            // 更新风向数据
            if (weatherData.winddirection) {
                updateWindData(weatherData.winddirection);
            }
            
            // 更新趋势图 - 注意：需要将风力等级转换为风速近似值
            const windSpeed = windPowerNum * 3; // 简单转换：1级≈3m/s
            updateEnvChart(temp, windSpeed, humidity);
            
            // 更新校园周边环境数据
            updateAmbientEnvironment();
            
            // 更新交通拥堵指数图表
            updateTrafficChart();
        } else {
            console.error('❌ 天气API返回数据格式错误：缺少lives字段');
            console.error('响应数据:', data);
            // 使用模拟数据
            useMockWeatherData();
        }
    } else {
        console.error('❌ 天气API返回错误状态:', data);
        // 使用模拟数据
        useMockWeatherData();
    }
}

// 使用模拟数据作为API请求失败时的备用
function useMockWeatherData() {
    console.log('使用模拟天气数据');
    
    // 模拟郑州科技学院万山湖校区的实时天气数据
    const weatherData = {
        temperature: '23.5',
        windpower: '2',
        winddirection: '东北',
        humidity: '65',
        weather: '晴',
        airquality: '优'
    };
    
    // 更新温度
    const temp = parseFloat(weatherData.temperature);
    document.getElementById('hud-temp').textContent = `${temp.toFixed(1)}°C`;
    document.getElementById('env-temp').textContent = `${temp.toFixed(1)}°C`;
    
    // 更新风力
    const windPower = parseFloat(weatherData.windpower);
    const windDisplay = formatWindDisplay(windPower);
    
    document.getElementById('hud-wind').innerHTML = `${windDisplay.icon} ${windDisplay.level}`;
    document.getElementById('env-wind').innerHTML = `${windDisplay.icon} ${windDisplay.level}`;
    
    // 更新湿度
    const humidity = parseInt(weatherData.humidity);
    document.getElementById('hud-humidity').textContent = `${humidity}%`;
    document.getElementById('env-hum').textContent = `${humidity}%`;
    
    // 更新天气状态
    const weather = weatherData.weather;
    document.getElementById('weather-mode').textContent = weather;
    
    // 更新空气质量
    const airQuality = humidity > 80 ? '良' : temp > 35 ? '轻度污染' : '优';
    document.getElementById('hud-air-quality').textContent = airQuality;
    document.getElementById('env-air').textContent = airQuality;
    
    // 根据模拟天气数据更新场景天气效果
    setWeatherMode(weather, temp, humidity, windPower);
    
    // 更新风向数据
    updateWindData(weatherData.winddirection);
    
    // 更新趋势图
    const windSpeed = windPower * 3;
    updateEnvChart(temp, windSpeed, humidity);
}

// 获取天气图标
function getWeatherIcon(weather) {
    const weatherIcons = {
        '晴': '☀️',
        '多云': '⛅',
        '阴': '☁️',
        '雨': '🌧️',
        '雪': '❄️',
        '雾': '🌫️',
        '雷阵雨': '⛈️',
        '小雨': '🌦️',
        '中雨': '🌧️',
        '大雨': '🌧️',
        '暴雨': '⛈️'
    };
    
    for (const [key, icon] of Object.entries(weatherIcons)) {
        if (weather.includes(key)) {
            return icon;
        }
    }
    
    return '☀️'; // 默认图标
}

// 获取风力图标
function getWindIcon(windPower) {
    const windIcons = {
        0: '💨',
        1: '🌬️',
        2: '🌬️',
        3: '🌬️',
        4: '💨',
        5: '💨',
        6: '🌪️',
        7: '🌪️',
        8: '🌪️',
        9: '🌪️',
        10: '🌪️'
    };
    
    return windIcons[Math.min(Math.floor(windPower), 10)] || '💨';
}

// 格式化风力显示，添加描述
function formatWindDisplay(windPower) {
    const windDescriptions = {
        0: '无风',
        1: '软风',
        2: '轻风',
        3: '微风',
        4: '和风',
        5: '清风',
        6: '强风',
        7: '疾风',
        8: '大风',
        9: '烈风',
        10: '狂风'
    };
    
    const windPowerNum = Math.min(Math.floor(windPower), 10);
    return {
        level: `${windPowerNum} 级`,
        description: windDescriptions[windPowerNum] || '未知',
        icon: getWindIcon(windPowerNum)
    };
}

// 模拟天气数据会定期随机变化，模拟实时更新
function updateMockWeatherData() {
    // 从HUD元素获取当前数据
    const hudTempElement = document.getElementById('hud-temp');
    const hudWindElement = document.getElementById('hud-wind');
    const hudHumidityElement = document.getElementById('hud-humidity');
    
    // 温度随机变化（±0.5°C）
    let temp = parseFloat(hudTempElement.textContent);
    temp += (Math.random() - 0.5) * 1.0;
    temp = Math.max(0, Math.min(35, temp));
    
    // 风力随机变化（±1级）
    // 从包含图标的文本中提取风力数值
    let currentWindText = hudWindElement.textContent;
    // 匹配数字部分
    const windMatch = currentWindText.match(/\d+/);
    let windPower = windMatch ? parseInt(windMatch[0]) : 2; // 默认值为2级
    windPower += Math.floor((Math.random() - 0.5) * 2);
    windPower = Math.max(0, Math.min(10, windPower));
    
    // 湿度随机变化（±5%）
    let humidity = parseInt(hudHumidityElement.textContent);
    humidity += Math.floor((Math.random() - 0.5) * 10);
    humidity = Math.max(30, Math.min(90, humidity));
    
    // 使用优化的风力显示函数
    const windDisplay = formatWindDisplay(windPower);
    
    // 更新 HUD 数值
    document.getElementById('hud-temp').textContent = `${temp.toFixed(1)}°C`;
    document.getElementById('hud-wind').innerHTML = `${windDisplay.icon} ${windDisplay.level}`;
    document.getElementById('hud-humidity').textContent = `${humidity}%`;
    document.getElementById('env-temp').textContent = `${temp.toFixed(1)}°C`;
    document.getElementById('env-wind').innerHTML = `${windDisplay.icon} ${windDisplay.level}`;
    document.getElementById('env-hum').textContent = `${humidity}%`;
    
    // 更新空气质量
    const airQuality = humidity > 80 ? '良' : temp > 35 ? '轻度污染' : '优';
    document.getElementById('hud-air-quality').textContent = airQuality;
    document.getElementById('env-air').textContent = airQuality;
    
    // 随机更新风向
    const windDirections = ['东', '南', '西', '北', '东南', '东北', '西南', '西北'];
    const randomDirection = windDirections[Math.floor(Math.random() * windDirections.length)];
    updateWindData(randomDirection);
    
    // 更新趋势图 - 注意：需要将风力等级转换为风速近似值
    const windSpeed = windPower * 3; // 简单转换：1级≈3m/s
    updateEnvChart(temp, windSpeed, humidity);
    
    // 更新风向趋势图表
    updateWindTrendChart();
}

// 更新风向数据
function updateWindData(direction) {
    console.log('💨 更新风向数据:', direction);
    
    // 根据风向文字转换为角度
    const directionToDegree = {
        '东': 90,
        '南': 180,
        '西': 270,
        '北': 0,
        '东南': 135,
        '东北': 45,
        '西南': 225,
        '西北': 315
    };
    
    const degree = directionToDegree[direction] || 0;
    
    // 更新风向数据
    windData.direction = direction;
    windData.degree = degree;
    windData.desc = `${direction}风`;
    
    // 更新风向趋势数据
    windData.trend.push(degree);
    if (windData.trend.length > 20) {
        windData.trend.shift(); // 保持数据点数量在20以内
    }
    
    // 更新风向显示
    updateWindDisplay();
    
    // 更新风向趋势图表
    updateWindTrendChart();
}

// 更新风向显示
function updateWindDisplay() {
    // 更新风向文字
    document.getElementById('wind-direction').textContent = windData.direction;
    document.getElementById('wind-direction-desc').textContent = windData.desc;
    
    // 更新风向玫瑰图箭头
    const windRoseArrow = document.getElementById('wind-rose-arrow');
    if (windRoseArrow) {
        windRoseArrow.style.transform = `rotate(${windData.degree}deg)`;
    }
}

// 更新风向趋势图表
function updateWindTrendChart() {
    if (!window.windTrendChart) return;
    
    // 生成更真实的风向变化数据，基于当前数据进行小幅度随机变化
    const currentData = window.windTrendChart.data.datasets[0].data;
    const newData = currentData.map(value => {
        // 在当前值基础上进行±20°的随机变化
        const change = (Math.random() - 0.5) * 40;
        let newValue = value + change;
        // 确保数值在0-360范围内
        newValue = (newValue + 360) % 360;
        return Math.round(newValue);
    });
    
    window.windTrendChart.data.datasets[0].data = newData;
    window.windTrendChart.update('none');
}

function initDataUpdates() {
    // 初始获取一次天气数据
    fetchWeatherData();
    // 初始更新一次模拟天气数据，但延迟执行，确保图表初始化完成
    setTimeout(updateMockWeatherData, 1000);
    // 初始更新一次交通和环境数据
    setTimeout(updateTrafficChart, 1500);
    setTimeout(updateAmbientEnvironment, 2000);
    
    // 每10秒获取一次真实天气数据
    setInterval(fetchWeatherData, 10 * 1000);
    // 每3秒更新一次模拟天气数据，模拟实时变化
    setInterval(updateMockWeatherData, 3 * 1000);
    // 每5秒更新一次交通数据
    setInterval(updateTrafficChart, 5 * 1000);
    // 每5秒更新一次校园周边环境数据
    setInterval(updateAmbientEnvironment, 5 * 1000);
}

function updateDescriptions(temp, wind, humidity) {
    // 移除描述更新，因为HTML中已移除相关元素
}

function applyWeatherByTemperature(temp, humidity, wind) {
    // 移除天气模式更新，因为HTML中已移除相关元素
}

function setWeatherMode(mode, temp = 23, humidity = 60, wind = 3) {
    console.log('设置天气模式:', mode);
    weatherMode = mode;
    
    // 重置所有粒子系统
    if (rainSystem) rainSystem.visible = false;
    if (snowSystem) snowSystem.visible = false;
    
    // 根据天气模式设置不同的场景效果
    switch (mode) {
        case '晴':
        case '晴天':
            // 晴天效果
            updateSkyColor(0x4a90e2, 0x87ceeb); // 蓝天白云
            if (!isNightMode && mainLight) {
                mainLight.intensity = 0.7;
            }
            break;
            
        case '多云':
            // 多云效果
            updateSkyColor(0x7b8c99, 0xa6b7c5); // 灰蓝色天空
            if (!isNightMode && mainLight) {
                mainLight.intensity = 0.15;
            }
            break;
            
        case '阴':
        case '阴天':
            // 阴天效果
            updateSkyColor(0x6c7a89, 0x8d9ca7); // 深灰色天空
            if (!isNightMode) {
                mainLight.intensity = 0.5;
            }
            break;
            
        case '小雨':
            // 小雨效果
            updateSkyColor(0x6c7a89, 0x8d9ca7);
            if (!isNightMode) {
                mainLight.intensity = 0.25;
            }
            if (rainSystem) rainSystem.visible = true;
            break;
            
        case '中雨':
        case '大雨':
        case '雨':
            // 雨效果
            updateSkyColor(0x5a6a79, 0x7d8a97);
            if (!isNightMode) {
                mainLight.intensity = 0.3;
            }
            if (rainSystem) rainSystem.visible = true;
            break;
            
        case '雪':
        case '小雪':
        case '大雪':
            // 雪效果
            updateSkyColor(0xe0e5ec, 0xc6d0da);
            if (!isNightMode) {
                mainLight.intensity = 0.4;
            }
            if (snowSystem) snowSystem.visible = true;
            break;
            
        case '雷阵雨':
        case '暴雨':
            // 雷阵雨效果
            updateSkyColor(0x4a5a69, 0x6d7a87);
            if (!isNightMode) {
                mainLight.intensity = 0.2;
            }
            if (rainSystem) rainSystem.visible = true;
            break;
            
        case '雾':
        case '雾霾':
            // 雾效果
            updateSkyColor(0xcccccc, 0xd9d9d9);
            mainLight.intensity = 0.4;
            // 添加雾效果
            scene.fog = new THREE.Fog(0xcccccc, 50, 200);
            break;
            
        default:
            // 默认晴天
            updateSkyColor(0x4a90e2, 0x87ceeb);
            mainLight.intensity = 1.1;
            // 移除雾效果
            scene.fog = null;
    }
}

// 更新天空颜色
function updateSkyColor(topColor, bottomColor) {
    if (scene && scene.userData && scene.userData.sky) {
        const sky = scene.userData.sky;
        sky.material.uniforms.topColor.value = new THREE.Color(topColor);
        sky.material.uniforms.bottomColor.value = new THREE.Color(bottomColor);
    }
    // 移除雾效果（除了雾天）
    if (scene && (weatherMode !== '雾' && weatherMode !== '雾霾')) {
        scene.fog = null;
    }
}

// 白天黑夜切换功能
function toggleDayNight() {
    // 获取toggle元素
    const toggle = document.getElementById('dayNightToggle');
    
    if (toggle && scene && ambientLight && mainLight) {
        // 更新isNightMode状态
        isNightMode = toggle.checked;
        
        // 切换场景灯光
        if (isNightMode) {
            // 夜间模式 - 降低亮度
            ambientLight.intensity = 0.05;
            mainLight.intensity = 0.05;
            
            // 调整太阳和月亮光源
            if (scene.userData.sunLight) {
                scene.userData.sunLight.intensity = 0.0; // 关闭太阳光源
            }
            if (scene.userData.moonLight) {
                scene.userData.moonLight.intensity = 0.1; // 打开月亮光源
            }
            
            // 调整天空为夜间模式
            if (scene.userData.sky) {
                const sky = scene.userData.sky;
                sky.material.uniforms.isNight.value = true;
            }
        } else {
            // 白天模式 - 恢复亮度
            ambientLight.intensity = 0.3;
            mainLight.intensity = 0.7;
            
            // 调整太阳和月亮光源
            if (scene.userData.sunLight) {
                scene.userData.sunLight.intensity = 0.8; // 打开太阳光源
            }
            if (scene.userData.moonLight) {
                scene.userData.moonLight.intensity = 0.0; // 关闭月亮光源
            }
            
            // 调整天空为白天模式
            if (scene.userData.sky) {
                const sky = scene.userData.sky;
                sky.material.uniforms.isNight.value = false;
            }
        }
    }
}

function initControls() {
    // 初始化白天黑夜切换开关
    const toggle = document.getElementById('dayNightToggle');
    console.log('初始化白天黑夜切换开关:', toggle);
    
    if (toggle) {
        // 移除可能存在的旧事件监听器
        toggle.removeEventListener('change', toggleDayNight);
        toggle.removeEventListener('click', toggleDayNight);
        
        // 添加change事件监听器
        toggle.addEventListener('change', function() {
            console.log('change事件触发');
            toggleDayNight();
        });
        
        // 初始化状态
        isNightMode = toggle.checked;
        console.log('初始isNightMode:', isNightMode);
        
        // 初始设置灯光和天空 - 添加scene是否存在的检查
        if (isNightMode) {
            // 夜间模式
            if (ambientLight) ambientLight.intensity = 0.05;
            if (mainLight) mainLight.intensity = 0.05;
            
            // 调整太阳和月亮光源 - 检查scene是否存在
            if (scene && scene.userData.sunLight) {
                scene.userData.sunLight.intensity = 0.0;
            }
            if (scene && scene.userData.moonLight) {
                scene.userData.moonLight.intensity = 0.1;
            }
            
            // 初始设置夜间天空 - 检查scene是否存在
            if (scene && scene.userData.sky) {
                const sky = scene.userData.sky;
                sky.material.uniforms.isNight.value = true;
            }
        } else {
            // 白天模式
            if (ambientLight) ambientLight.intensity = 0.3;
            if (mainLight) mainLight.intensity = 0.7;
            
            // 调整太阳和月亮光源 - 检查scene是否存在
            if (scene && scene.userData.sunLight) {
                scene.userData.sunLight.intensity = 0.8;
            }
            if (scene && scene.userData.moonLight) {
                scene.userData.moonLight.intensity = 0.0;
            }
            
            // 初始设置白天天空 - 检查scene是否存在
            if (scene && scene.userData.sky) {
                const sky = scene.userData.sky;
                sky.material.uniforms.isNight.value = false;
            }
        }
    }
    
    // 不需要为toggle-btn添加点击事件，因为label元素会自动触发input的状态变化
    // 点击label内部的任何元素都会自动切换checkbox的状态并触发change事件
}

function updateTime() {
    // 更新内部的time-display元素
    const timeDisplayElement = document.getElementById('time-display');
    if (timeDisplayElement) {
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0];
        timeDisplayElement.textContent = timeString;
        
        // 确保父元素也显示
        const timeElement = document.getElementById('update-time');
        if (timeElement) {
            timeElement.style.display = 'block';
            timeElement.style.opacity = '1';
            timeElement.style.visibility = 'visible';
        }
    }
}

// 模型控制按钮初始化函数
function initModelControls() {
    console.log('初始化模型控制按钮...');
    
    // 获取所有控制按钮
    const controlButtons = document.querySelectorAll('.control-btn');
    
    // 为每个按钮添加点击事件
    controlButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            controlButtons.forEach(btn => btn.classList.remove('active'));
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            // 获取要显示的模型类型
            const displayType = this.getAttribute('data-display');
            console.log(`切换模型显示类型: ${displayType}`);
            
            // 执行模型显示切换
            toggleModelDisplay(displayType);
        });
    });
    
    console.log('模型控制按钮初始化完成');
}

// 切换模型显示类型
function toggleModelDisplay(displayType) {
    // 获取文科教学楼模型
    const teachingBuilding = scene?.userData?.teachingBuilding;
    
    if (!teachingBuilding) {
        console.warn('未找到文科教学楼模型，无法切换显示类型');
        return;
    }
    
    console.log(`=== 切换模型显示类型: ${displayType} ===`);
    
    // 获取模型的externalIds、categories和types数据
    const externalIds = teachingBuilding.userData?.externalIds || {};
    const categories = teachingBuilding.userData?.categories || {};
    const types = teachingBuilding.userData?.types || {};
    
    console.log(`可用的数据数量:`);
    console.log(`- externalIds: ${Object.keys(externalIds).length}`);
    console.log(`- categories: ${Object.keys(categories).length}`);
    console.log(`- types: ${Object.keys(types).length}`);
    
    // 显示前5个示例数据
    const externalIdExamples = Object.entries(externalIds).slice(0, 5);
    const categoryExamples = Object.entries(categories).slice(0, 5);
    const typeExamples = Object.entries(types).slice(0, 5);
    
    console.log('externalIds示例:', externalIdExamples);
    console.log('categories示例:', categoryExamples);
    console.log('types示例:', typeExamples);
    
    let beamCount = 0;
    let totalMeshCount = 0;
    
    // 遍历模型的所有子节点，根据显示类型决定是否显示
    teachingBuilding.traverse(function(child) {
        if (child.isMesh) {
            totalMeshCount++;
            
            // 显示前10个网格名称示例
            if (totalMeshCount <= 10) {
                console.log(`网格名称示例 ${totalMeshCount}: ${child.name}`);
            }
            
            // 默认显示所有网格
            child.visible = true;
            
            // 如果是显示梁，需要根据数据库数据判断是否为梁
            if (displayType === 'beams') {
                // 使用数据库中的数据判断是否为梁
                const isBeam = isBeamMesh(child, externalIds, categories, types);
                child.visible = isBeam;
                if (isBeam) {
                    beamCount++;
                }
            }
        }
    });
    
    console.log(`=== 模型显示类型已切换为: ${displayType} ===`);
    console.log(`总网格数量: ${totalMeshCount}`);
    console.log(`显示的梁数量: ${beamCount}`);
}

// 判断网格是否为梁，使用数据库中的数据
function isBeamMesh(mesh, externalIds, categories = {}, types = {}) {
    console.log(`检查网格: ${mesh.name}, 类型: ${mesh.type}, 父对象: ${mesh.parent?.name}`);
    
    const meshName = mesh.name;
    
    // 1. 优先使用typeid进行筛选 - 核心逻辑：通过梁的typeid筛选梁
    // 检查types映射中是否包含梁的typeid
    for (const [key, value] of Object.entries(types)) {
        // 检查网格名称是否与类型键相关联
        if (meshName.includes(key) || key.includes(meshName) || 
            meshName === key || mesh.uuid === key ||
            meshName.replace(/[^a-zA-Z0-9]/g, '') === key.replace(/[^a-zA-Z0-9]/g, '')) {
            
            // 检查typeid是否为梁的代表数据
            // 梁的代表typeid通常包含以下标识：
            // - OST_StructuralFraming（Revit中梁的标准类别）
            // - beam或梁（直接标识）
            // - Structural或structural（结构构件）
            // - frame或框架（框架构件）
            const isBeamType = value.includes('OST_StructuralFraming') || 
                              value.toLowerCase().includes('beam') || 
                              value.includes('梁') || 
                              value.toLowerCase().includes('structural') || 
                              value.toLowerCase().includes('frame') || 
                              value.includes('框架');
            
            if (isBeamType) {
                console.log(`网格 ${meshName} 通过typeid ${value} 被识别为梁`);
                return true;
            }
        }
    }
    
    // 2. 辅助验证：检查categories映射，确保类型判断的准确性
    for (const [key, value] of Object.entries(categories)) {
        if (meshName.includes(key) || key.includes(meshName) || 
            meshName === key || mesh.uuid === key ||
            meshName.replace(/[^a-zA-Z0-9]/g, '') === key.replace(/[^a-zA-Z0-9]/g, '')) {
            
            const isBeamCategory = value.includes('OST_StructuralFraming') || 
                                 value.toLowerCase().includes('beam') || 
                                 value.includes('梁') || 
                                 value.toLowerCase().includes('structural') || 
                                 value.toLowerCase().includes('frame') || 
                                 value.includes('框架');
            
            if (isBeamCategory) {
                console.log(`网格 ${meshName} 通过category ${value} 被识别为梁`);
                return true;
            }
        }
    }
    
    // 3. 外部ID验证：确保构件是结构梁
    let matchingExternalId = null;
    for (const [key, externalId] of Object.entries(externalIds)) {
        if (meshName.includes(key) || key.includes(meshName) || 
            meshName === key || mesh.uuid === key ||
            meshName.replace(/[^a-zA-Z0-9]/g, '') === key.replace(/[^a-zA-Z0-9]/g, '')) {
            matchingExternalId = externalId;
            break;
        }
    }
    
    if (matchingExternalId) {
        const isBeamExternalId = matchingExternalId.includes('OST_StructuralFraming') || 
                                matchingExternalId.toLowerCase().includes('beam') || 
                                matchingExternalId.includes('梁') ||
                                matchingExternalId.toLowerCase().includes('structural') ||
                                matchingExternalId.toLowerCase().includes('frame');
        
        if (isBeamExternalId) {
            console.log(`网格 ${meshName} 通过externalId ${matchingExternalId} 被识别为梁`);
            return true;
        }
    }
    
    // 4. 最终验证：检查网格名称是否直接包含梁的标识
    if (meshName.includes('OST_StructuralFraming') || 
        meshName.toLowerCase().includes('beam') || 
        meshName.includes('梁') || 
        meshName.toLowerCase().includes('structural') || 
        meshName.toLowerCase().includes('frame')) {
        console.log(`网格 ${meshName} 名称包含梁标识，识别为梁`);
        return true;
    }
    
    // 严格筛选：只有通过typeid及相关验证的网格才被识别为梁
    console.log(`网格 ${meshName} 不是梁，将被隐藏`);
    return false;
}



function initParticles() {
    const particlesContainer = document.getElementById('particles-container');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        particle.style.left = `${x}%`;
        particle.style.top = `${y}%`;
        
        // 随机大小
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // 随机动画
        const duration = Math.random() * 20 + 10;
        particle.style.animation = `float ${duration}s linear infinite`;
        
        particlesContainer.appendChild(particle);
        
        // 添加浮动动画
        const keyframes = `
            @keyframes float {
                0% {
                    transform: translate(0, 0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
    }
}
