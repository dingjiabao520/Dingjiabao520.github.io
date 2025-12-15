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
    
    // 触摸事件相关变量
    this.touchStartDistance = 0;
    this.touchStartAngle = 0;
    this.touchStartPan = new THREE.Vector2();
    this.touchCurrentPan = new THREE.Vector2();
    this.isMultiTouch = false;
    
    // 计算两点之间的距离
    const getDistance = (touch1, touch2) => {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };
    
    // 计算两点之间的角度
    const getAngle = (touch1, touch2) => {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.atan2(dy, dx);
    };
    
    // 触摸开始事件
    const onTouchStart = (event) => {
        event.preventDefault();
        
        if (event.touches.length === 1) {
            // 单指触摸 - 旋转
            this.state = this.ROTATE;
            this.mouseOld.set(event.touches[0].clientX, event.touches[0].clientY);
            this.isMultiTouch = false;
        } else if (event.touches.length === 2) {
            // 双指触摸 - 缩放和旋转
            this.state = this.DOLLY;
            this.touchStartDistance = getDistance(event.touches[0], event.touches[1]);
            this.touchStartAngle = getAngle(event.touches[0], event.touches[1]);
            this.touchStartPan.set(
                (event.touches[0].clientX + event.touches[1].clientX) / 2,
                (event.touches[0].clientY + event.touches[1].clientY) / 2
            );
            this.isMultiTouch = true;
        }
    };
    
    // 触摸移动事件
    const onTouchMove = (event) => {
        event.preventDefault();
        
        if (this.state === -1) return;
        
        if (event.touches.length === 1 && !this.isMultiTouch) {
            // 单指触摸 - 旋转
            this.mouse.set(event.touches[0].clientX, event.touches[0].clientY);
            const deltaX = this.mouse.x - this.mouseOld.x;
            const deltaY = this.mouse.y - this.mouseOld.y;
            
            // 旋转控制
            this.sphericalDelta.theta -= 2 * Math.PI * deltaX / this.domElement.clientWidth * this.rotateSpeed;
            this.sphericalDelta.phi -= 2 * Math.PI * deltaY / this.domElement.clientHeight * this.rotateSpeed;
            
            this.mouseOld.copy(this.mouse);
        } else if (event.touches.length === 2) {
            // 双指触摸 - 缩放和旋转
            const currentDistance = getDistance(event.touches[0], event.touches[1]);
            const currentAngle = getAngle(event.touches[0], event.touches[1]);
            
            // 计算缩放因子
            const scale = currentDistance / this.touchStartDistance;
            this.scale *= Math.pow(scale, this.zoomSpeed);
            
            // 计算旋转角度变化
            const angleDelta = currentAngle - this.touchStartAngle;
            this.sphericalDelta.theta -= angleDelta * this.rotateSpeed;
            
            // 计算平移
            this.touchCurrentPan.set(
                (event.touches[0].clientX + event.touches[1].clientX) / 2,
                (event.touches[0].clientY + event.touches[1].clientY) / 2
            );
            
            const panDeltaX = this.touchCurrentPan.x - this.touchStartPan.x;
            const panDeltaY = this.touchCurrentPan.y - this.touchStartPan.y;
            
            // 平移控制
            const panLeft = -panDeltaX * this.panSpeed * 0.01;
            const panUp = panDeltaY * this.panSpeed * 0.01;
            
            const v = new THREE.Vector3().subVectors(this.camera.position, this.target);
            const targetDistance = v.length();
            const aspect = this.camera.aspect;
            
            this.panOffset.x += panLeft * v.x * (1 / aspect);
            this.panOffset.z += panUp * v.z;
            
            // 更新起始状态
            this.touchStartDistance = currentDistance;
            this.touchStartAngle = currentAngle;
            this.touchStartPan.copy(this.touchCurrentPan);
        }
        
        this.update();
    };
    
    // 触摸结束事件
    const onTouchEnd = (event) => {
        this.state = -1;
        this.isMultiTouch = false;
    };
    
    // 事件监听
    this.domElement.addEventListener('contextmenu', onContextMenu);
    this.domElement.addEventListener('mousedown', onMouseDown);
    this.domElement.addEventListener('wheel', onMouseWheel);
    this.domElement.addEventListener('mousemove', onMouseMove);
    this.domElement.addEventListener('mouseup', onMouseUp);
    this.domElement.addEventListener('mouseleave', onMouseUp);
    
    // 添加触摸事件监听
    this.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', onTouchEnd);
    this.domElement.addEventListener('touchcancel', onTouchEnd);
    
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