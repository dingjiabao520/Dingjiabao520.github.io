// 完整的OrbitControls实现，兼容script.js中的属性访问
THREE.OrbitControls = function(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // 状态变量
    this.state = -1;
    this.ROTATE = 0;
    this.DOLLY = 1;
    this.PAN = 2;
    
    // 相机目标
    this.target = new THREE.Vector3();
    
    // 球面坐标
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    
    // 控制参数 - 这些属性会被script.js访问和修改
    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.0;
    this.panSpeed = 1.0;
    
    // 阻尼效果
    this.enableDamping = false;
    this.dampingFactor = 0.1;
    
    // 缩放参数
    this.scale = 1;
    
    // 平移参数
    this.panOffset = new THREE.Vector3();
    
    // 鼠标位置
    this.mouse = new THREE.Vector2();
    this.mouseOld = new THREE.Vector2();
    
    // 初始化相机位置
    var offset = new THREE.Vector3().subVectors(camera.position, this.target);
    this.spherical.setFromVector3(offset);
    
    // 使用箭头函数定义事件处理方法，确保this上下文正确绑定
    const onContextMenu = (event) => {
        event.preventDefault();
    };
    
    const onMouseDown = (event) => {
        event.preventDefault();
        
        this.mouseOld.set(event.clientX, event.clientY);
        
        if (event.button === 0) {
            this.state = this.ROTATE;
        } else if (event.button === 1) {
            this.state = this.PAN;
        } else if (event.button === 2) {
            this.state = this.DOLLY;
        }
    };
    
    const onMouseWheel = (event) => {
        event.preventDefault();
        
        // 统一滚轮方向：向前滚动（缩小）deltaY 为负数，向后滚动（放大）deltaY 为正数
        // 但不同浏览器可能有不同的实现，我们需要标准化
        var delta = event.deltaY;
        
        // 标准化滚轮方向：滚轮向前（放大）时，我们希望 scale 增大
        // 所以如果 deltaY 为负数（Firefox向前），我们需要放大；如果 deltaY 为正数（Chrome向前），我们也需要放大
        // 因此，我们需要反转 delta 的符号，确保滚轮向前时 scale 增大
        var zoomFactor = Math.pow(0.95, -delta * 0.01 * this.zoomSpeed);
        this.scale *= zoomFactor;
        this.update();
    };
    
    const onMouseMove = (event) => {
        event.preventDefault();
        
        if (this.state === -1) return;
        
        this.mouse.set(event.clientX, event.clientY);
        var deltaX = this.mouse.x - this.mouseOld.x;
        var deltaY = this.mouse.y - this.mouseOld.y;
        
        // 获取相机宽高比
        var aspect = this.camera.aspect;
        
        if (this.state === this.ROTATE) {
            // 旋转控制，基于窗口尺寸和旋转速度
            this.sphericalDelta.theta -= 2 * Math.PI * deltaX / this.domElement.clientWidth * this.rotateSpeed;
            this.sphericalDelta.phi -= 2 * Math.PI * deltaY / this.domElement.clientHeight * this.rotateSpeed;
        } else if (this.state === this.PAN) {
            // 平移控制，基于相机方向和宽高比
            var panLeft = -deltaX * this.panSpeed * 0.01;
            var panUp = deltaY * this.panSpeed * 0.01;
            
            var v = new THREE.Vector3();
            v.copy(this.camera.position).sub(this.target);
            var targetDistance = v.length();
            
            // 基于目标距离和平移距离计算平移量
            v.multiplyScalar(Math.tan(this.camera.fov * Math.PI / 360) * 2 * targetDistance);
            
            this.panOffset.x += panLeft * v.x * (1 / aspect);
            this.panOffset.z += panUp * v.z;
        } else if (this.state === this.DOLLY) {
            // 缩放控制
            var zoomDelta = deltaY * this.zoomSpeed * 0.01;
            this.scale *= Math.pow(0.95, zoomDelta);
        }
        
        this.mouseOld.copy(this.mouse);
        this.update();
    };
    
    const onMouseUp = (event) => {
        this.state = -1;
    };
    
    // 事件监听
    this.domElement.addEventListener('contextmenu', onContextMenu);
    this.domElement.addEventListener('mousedown', onMouseDown);
    this.domElement.addEventListener('wheel', onMouseWheel);
    this.domElement.addEventListener('mousemove', onMouseMove);
    this.domElement.addEventListener('mouseup', onMouseUp);
    this.domElement.addEventListener('mouseleave', onMouseUp);
    
    this.update = function() {
        // 应用旋转
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        // 限制角度
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
        
        // 应用缩放
        this.spherical.radius *= this.scale;
        
        // 限制距离
        this.spherical.radius = Math.max(10, Math.min(200, this.spherical.radius));
        
        // 应用阻尼效果
        if (this.enableDamping) {
            this.sphericalDelta.theta *= (1 - this.dampingFactor);
            this.sphericalDelta.phi *= (1 - this.dampingFactor);
        } else {
            this.sphericalDelta.set(0, 0, 0);
        }
        
        this.scale = 1;
        
        // 更新相机位置
        this.camera.position.setFromSpherical(this.spherical);
        this.camera.position.add(this.panOffset);
        this.target.add(this.panOffset);
        this.panOffset.set(0, 0, 0);
        
        this.camera.lookAt(this.target);
    };
    
    // 初始更新
    this.update();
};