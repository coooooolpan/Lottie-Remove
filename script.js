document.addEventListener('DOMContentLoaded', function() {
    const mainContainer = document.getElementById('mainContainer');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileNameText');
    const fileSize = document.getElementById('fileSize');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusMessage = document.getElementById('statusMessage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const themeToggle = document.getElementById('themeToggle');
    const header = document.querySelector('header');
    
    let selectedFile = null;
    let processedData = null;
    
    // 监听页面滚动，调整导航栏样式
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // 检测系统主题色并设置初始主题
    function setInitialTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-toggle .material-icons').textContent = 'dark_mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.querySelector('.theme-toggle .material-icons').textContent = 'light_mode';
        }
    }
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        document.querySelector('.theme-toggle .material-icons').textContent = e.matches ? 'dark_mode' : 'light_mode';
    });
    
    // 页面加载时设置初始主题
    document.addEventListener('DOMContentLoaded', setInitialTheme);
    
    // 主题切换功能
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // 切换图标
        const themeIcon = this.querySelector('.material-icons');
        themeIcon.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
    });
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 处理拖放事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }
    
    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });
    
    function handleFiles(files) {
        if (files[0].type !== 'application/json' && !files[0].name.endsWith('.json')) {
            showStatus('请选择 JSON 文件', 'error');
            return;
        }
        
        // 检查文件大小限制 (10MB)
        if (files[0].size > 10 * 1024 * 1024) {
            showStatus('文件大小超过 10MB 限制', 'error');
            return;
        }
        
        // 重置完成状态
        mainContainer.classList.remove('completed-state');
        
        selectedFile = files[0];
        fileName.textContent = selectedFile.name;
        fileSize.textContent = formatFileSize(selectedFile.size);
        fileInfo.style.display = 'block';
        processBtn.style.display = 'block';
        processBtn.disabled = false;
        downloadBtn.style.display = 'none';
        statusMessage.style.display = 'none';
    }
    
    // 处理按钮点击事件
    processBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        
        processBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        statusMessage.style.display = 'none';
        
        const reader = new FileReader();
        
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 50); // 读取过程占总进度的50%
                progressBar.style.width = progress + '%';
                progressPercent.textContent = progress + '%';
            }
        };
        
        reader.onload = (event) => {
            try {
                const jsonContent = event.target.result;
                const originalSize = new Blob([jsonContent]).size;
                const jsonData = JSON.parse(jsonContent);
                
                // 更新进度到75%，表示开始处理
                progressBar.style.width = '75%';
                progressPercent.textContent = '75%';
                
                // 模拟处理过程
                setTimeout(() => {
                    try {
                        const result = removeLottieWatermark(jsonData);
                        // 优化JSON数据
                        optimizeLottieJson(result);
                        // 不使用格式化，直接紧凑序列化以减小文件体积
                        processedData = JSON.stringify(result);
                        
                        // 计算文件体积减少的百分比
                        const processedSize = new Blob([processedData]).size;
                        const sizeDiff = originalSize - processedSize;
                        const sizeReductionPercent = ((sizeDiff / originalSize) * 100).toFixed(2);
                        
                        const sizeMessage = sizeDiff > 0 
                            ? `文件体积减少了 ${formatFileSize(sizeDiff)} (${sizeReductionPercent}%)`
                            : `文件体积变化: ${formatFileSize(sizeDiff)}`;
                        
                        // 处理完成，更新进度到100%
                        progressBar.style.width = '100%';
                        progressPercent.textContent = '100%';
                        
                        setTimeout(() => {
                            // 切换到完成状态 - 简化布局
                            mainContainer.classList.add('completed-state');
                            
                            progressContainer.style.display = 'none';
                            
                            // 直接显示下载按钮，而不是显示成功动画
                            processBtn.style.display = 'none';
                            downloadBtn.style.display = 'block';
                            downloadBtn.animate([
                                { transform: 'scale(0.95)', opacity: 0 },
                                { transform: 'scale(1)', opacity: 1 }
                            ], {
                                duration: 300,
                                easing: 'ease-out'
                            });
                            
                            showStatus(`处理成功！${sizeMessage}`, 'success');
                        }, 500);
                        
                    } catch (error) {
                        handleProcessingError(error);
                    }
                }, 1000); // 模拟处理时间
                
            } catch (error) {
                handleProcessingError(new Error('读取失败'));
            }
        };
        
        reader.onerror = () => {
            handleProcessingError(new Error('文件读取失败'));
        };
        
        reader.readAsText(selectedFile);
    });
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', () => {
        if (!processedData) return;
        
        const blob = new Blob([processedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // 添加"processed_"前缀到文件名
        const originalName = selectedFile.name;
        const processedName = 'processed_' + originalName;
        
        a.href = url;
        a.download = processedName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });
    
    // 显示状态消息
    function showStatus(message, type) {
        statusMessage.innerHTML = type === 'success' 
            ? `<i class="fa-solid fa-circle-check"></i>${message}` 
            : `<i class="fa-solid fa-triangle-exclamation"></i>${message}`;
        statusMessage.className = 'status ' + type;
        statusMessage.style.display = 'block';
        
        // 添加状态消息动画
        statusMessage.animate([
            { opacity: 0, transform: 'translateY(5px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    }
    
    // 处理错误
    function handleProcessingError(error) {
        console.error('处理错误:', error);
        progressContainer.style.display = 'none';
        showStatus('处理失败: ' + (error.message || '未知错误'), 'error');
        processBtn.disabled = false;
    }
    
    // 格式化文件大小显示
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        if (bytes < 0) return '-' + formatFileSize(-bytes);
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 优化 Lottie JSON 文件体积
    function optimizeLottieJson(data) {
        // 递归处理对象
        function optimizeObject(obj) {
            if (!obj || typeof obj !== 'object') return;
            
            // 处理数组
            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    optimizeObject(obj[i]);
                }
                return;
            }
            
            // 处理对象
            const keys = Object.keys(obj);
            for (const key of keys) {
                const value = obj[key];
                
                // 移除 null 和 undefined 值
                if (value === null || value === undefined) {
                    delete obj[key];
                    continue;
                }
                
                // 移除空数组
                if (Array.isArray(value) && value.length === 0) {
                    delete obj[key];
                    continue;
                }
                
                // 移除空对象
                if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
                    delete obj[key];
                    continue;
                }
                
                // 递归处理嵌套对象
                optimizeObject(value);
            }
        }
        
        optimizeObject(data);
    }
    
    // 移除 Lottie 水印的核心函数
    function removeLottieWatermark(lottieData) {
        if (!lottieData || !lottieData.layers || !Array.isArray(lottieData.layers)) {
            throw new Error('无效的 Lottie JSON 格式');
        }
        
        // 创建一个深拷贝，避免修改原始数据
        const processedData = JSON.parse(JSON.stringify(lottieData));
        
        // 查找并移除水印图层 (ind:12345679)
        const originalLayersCount = processedData.layers.length;
        processedData.layers = processedData.layers.filter(layer => {
            // 检查图层的 ind 属性是否为 12345679
            return layer.ind !== 12345679;
        });
        
        // 检查是否有图层被移除
        const removedLayersCount = originalLayersCount - processedData.layers.length;
        
        if (removedLayersCount === 0) {
            console.log('未找到水印图层 (ind:12345679)');
        } else {
            console.log(`已移除 ${removedLayersCount} 个水印图层`);
        }
        
        return processedData;
    }
}); 