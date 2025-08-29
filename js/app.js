// 主应用控制器
class AppController {
    constructor() {
        this.currentPage = 'diary';
        
        this.initializeApp();
        this.bindGlobalEvents();
        this.loadSettings();
    }
    
    // 初始化应用
    initializeApp() {
        // 初始化各个模块
        diaryController = new DiaryController();
        planController = new PlanController();
        
        // 将控制器设置为全局可访问，方便调试和HTML中的onclick事件
        window.diaryController = diaryController;
        window.planController = planController;
        
        // 设置初始页面
        this.showPage('diary');
        
        console.log('日常记录应用已启动');
    }
    
    // 绑定全局事件
    bindGlobalEvents() {
        // 导航切换
        const diaryTab = document.getElementById('diary-tab');
        const planTab = document.getElementById('plan-tab');
        const settingsBtn = document.getElementById('settings-btn');
        
        if (diaryTab) {
            diaryTab.addEventListener('click', () => {
                this.showPage('diary');
            });
        }
        
        if (planTab) {
            planTab.addEventListener('click', () => {
                this.showPage('plan');
            });
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // 文档链接现在使用直接的onclick绑定，在HTML中定义
        
        // 文档页面返回按钮
        const backToMain = document.getElementById('back-to-main');
        if (backToMain) {
            backToMain.addEventListener('click', () => {
                this.hideDocument();
            });
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // 页面卸载前保存数据
        window.addEventListener('beforeunload', () => {
            if (diaryController) {
                diaryController.saveDiary();
            }
        });
        
        // 在线/离线状态检测
        window.addEventListener('online', () => {
            MessageUtils.showSuccess('网络连接已恢复');
        });
        
        window.addEventListener('offline', () => {
            MessageUtils.showInfo('当前处于离线状态，数据将保存到本地');
        });
    }
    
    // 显示页面
    showPage(pageName) {
        // 更新导航状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.getElementById(`${pageName}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        let targetPage;
        switch (pageName) {
            case 'diary':
                targetPage = document.getElementById('diary-page');
                break;
            case 'plan':
                targetPage = document.getElementById('plan-page');
                planController.showPlanList();
                break;
        }
        
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
        }
    }
    
    // 处理键盘快捷键
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: 保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (this.currentPage === 'diary') {
                diaryController.saveDiary();
                MessageUtils.showSuccess('日记已保存');
            }
        }
        
        // Ctrl/Cmd + N: 新建
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (this.currentPage === 'diary') {
                if (e.shiftKey) {
                    diaryController.addTodo();
                } else {
                    diaryController.addMajorEvent();
                }
            } else if (this.currentPage === 'plan') {
                planController.createNewPlan();
            }
        }
        
        // Ctrl/Cmd + E: 导出
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (this.currentPage === 'diary') {
                diaryController.exportCurrentDiary();
            } else if (this.currentPage === 'plan') {
                this.exportAllPlans();
            }
        }
        
        // Ctrl/Cmd + 1/2: 切换页面
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '2') {
            e.preventDefault();
            const pages = ['diary', 'plan'];
            const pageIndex = parseInt(e.key) - 1;
            if (pages[pageIndex]) {
                this.showPage(pages[pageIndex]);
            }
        }
        
        // Esc: 关闭模态框
        if (e.key === 'Escape') {
            ModalUtils.hide();
            const confirmDialog = document.getElementById('confirm-dialog');
            if (confirmDialog.style.display === 'block') {
                confirmDialog.style.display = 'none';
            }
        }
    }
    
    // 显示设置
    showSettings() {
        const settings = storage.get(storage.keys.settings) || {};
        const storageInfo = storage.getStorageInfo();
        const diaryStats = diaryManager.getStatistics();
        const planStats = planManager.getStatistics();
        
        const content = `
            <div class="settings-panel">
                <h3>应用设置</h3>
                
                <div class="settings-section">
                    <h4>显示设置</h4>
                    <div class="setting-item">
                        <label>主题</label>
                        <select id="theme-select">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>浅色</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>深色</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>数据统计</h4>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${diaryStats.totalDays}</div>
                            <div class="stat-label">记录天数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${planStats.total}</div>
                            <div class="stat-label">创建计划</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${diaryStats.totalTodos}</div>
                            <div class="stat-label">待办事项</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${storageInfo.usedMB}MB</div>
                            <div class="stat-label">存储使用</div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>数据管理</h4>
                    <div class="setting-actions">
                        <button class="action-btn" onclick="appController.exportAllData()">导出所有数据</button>
                        <button class="action-btn" onclick="appController.importData()">导入数据</button>
                        <button class="action-btn danger" onclick="appController.clearAllDataConfirm()">清空所有数据</button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>键盘快捷键</h4>
                    <div class="shortcuts-list">
                        <div class="shortcut-item">
                            <span class="shortcut-key">Ctrl+S</span>
                            <span class="shortcut-desc">保存当前内容</span>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-key">Ctrl+N</span>
                            <span class="shortcut-desc">添加新项目</span>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-key">Ctrl+E</span>
                            <span class="shortcut-desc">导出当前内容</span>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-key">Ctrl+1/2</span>
                            <span class="shortcut-desc">切换页面</span>
                        </div>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button class="action-btn" onclick="appController.saveSettingsFromModal()">保存设置</button>
                    <button class="action-btn" onclick="ModalUtils.hide()">关闭</button>
                </div>
            </div>
        `;
        
        ModalUtils.show(content, '设置');
        
        // 为设置模态框添加特殊样式
        const modal = document.getElementById('modal');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.maxWidth = '1000px';
        modalContent.style.width = '95%';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflowY = 'auto';
        modalContent.style.margin = '2.5% auto';
        
        // 修改关闭按钮事件以重置样式
        const closeBtn = modal.querySelector('.close');
        const originalCloseHandler = closeBtn.onclick;
        closeBtn.onclick = () => {
            // 重置模态框样式
            modalContent.style.maxWidth = '';
            modalContent.style.width = '';
            modalContent.style.maxHeight = '';
            modalContent.style.overflowY = '';
            modalContent.style.margin = '';
            
            modal.style.display = 'none';
        };
        
        // 修改背景点击事件
        modal.onclick = (e) => {
            if (e.target === modal) {
                // 重置模态框样式
                modalContent.style.maxWidth = '';
                modalContent.style.width = '';
                modalContent.style.maxHeight = '';
                modalContent.style.overflowY = '';
                modalContent.style.margin = '';
                
                modal.style.display = 'none';
            }
        };
        
        // 添加设置样式
        this.addSettingsStyles();
    }
    
    // 添加设置样式
    addSettingsStyles() {
        if (document.querySelector('#settings-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = `
            .settings-panel {
                max-width: 900px;
                margin: 0 auto;
            }
            .settings-section {
                margin-bottom: var(--spacing-lg);
                padding: var(--spacing-md);
                background: var(--light-gray);
                border-radius: var(--border-radius-small);
            }
            .settings-section h4 {
                margin-bottom: var(--spacing-md);
                color: var(--dark-brown);
            }
            .setting-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-sm);
            }
            .setting-item label {
                color: var(--text-primary);
            }
            .setting-item select {
                padding: var(--spacing-xs) var(--spacing-sm);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-small);
                background: var(--cream-white);
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: var(--spacing-md);
            }
            @media (max-width: 900px) {
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            @media (max-width: 480px) {
                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
            .stat-card {
                text-align: center;
                padding: var(--spacing-md);
                background: var(--cream-white);
                border-radius: var(--border-radius-small);
                border: 1px solid var(--border-color);
            }
            .stat-number {
                font-size: var(--font-size-xl);
                font-weight: 600;
                color: var(--dark-brown);
                margin-bottom: var(--spacing-xs);
            }
            .stat-label {
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
            }
            .setting-actions {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-sm);
            }
            .shortcuts-list {
                background: var(--cream-white);
                border-radius: var(--border-radius-small);
                padding: var(--spacing-md);
            }
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                padding: var(--spacing-xs) 0;
                border-bottom: 1px solid var(--border-color);
            }
            .shortcut-item:last-child {
                border-bottom: none;
            }
            .shortcut-key {
                font-family: monospace;
                background: var(--light-gray);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: var(--font-size-xs);
            }
            .shortcut-desc {
                color: var(--text-secondary);
            }
            .settings-actions {
                display: flex;
                justify-content: center;
                gap: var(--spacing-md);
                margin-top: var(--spacing-lg);
            }
        `;
        document.head.appendChild(style);
    }
    
    // 从模态框保存设置
    saveSettingsFromModal() {
        const themeSelect = document.getElementById('theme-select');
        
        if (themeSelect) {
            this.applyTheme(themeSelect.value);
        }
        
        this.saveSettings();
        
        // 重置模态框样式
        const modal = document.getElementById('modal');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.maxWidth = '';
        modalContent.style.width = '';
        modalContent.style.maxHeight = '';
        modalContent.style.overflowY = '';
        modalContent.style.margin = '';
        
        ModalUtils.hide();
        MessageUtils.showSuccess('设置已保存');
    }
    
    // 应用主题
    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(`theme-${theme}`);
        
        // 保存主题设置
        const currentSettings = storage.get(storage.keys.settings) || {};
        currentSettings.theme = theme;
        storage.set(storage.keys.settings, currentSettings);
    }
    
    // 保存设置
    saveSettings() {
        const settings = {
            theme: document.body.classList.contains('theme-dark') ? 'dark' : 'light',
            autoSave: true,
            exportFormat: 'json'
        };
        
        storage.set(storage.keys.settings, settings);
    }
    
    // 加载设置
    loadSettings() {
        const settings = storage.get(storage.keys.settings);
        if (settings) {
            this.applyTheme(settings.theme || 'light');
        }
    }
    
    // 导出所有数据
    exportAllData() {
        const data = storage.exportAllData();
        const filename = `日常记录_备份_${DateUtils.getToday()}.json`;
        ExportUtils.exportAsJson(data, filename);
        MessageUtils.showSuccess('数据导出成功');
    }
    
    // 导出所有计划
    exportAllPlans() {
        const plans = planManager.getPlans();
        let content = '# 我的计划\n\n';
        
        plans.forEach((plan, index) => {
            content += `## ${index + 1}. ${plan.name}\n\n`;
            content += `状态: ${planController.getStatusText(plan.status)}\n\n`;
            
            if (plan.tasks.length > 0) {
                content += `### 任务列表\n`;
                plan.tasks.forEach((task, taskIndex) => {
                    const status = task.completed ? '✓' : '○';
                    const required = task.required ? ' (必需)' : '';
                    content += `${taskIndex + 1}. ${status} ${task.text}${required}\n`;
                });
                content += '\n';
            }
            
            const progress = planManager.getPlanProgress(plan);
            content += `进度: ${progress.completed}/${progress.total} (${progress.percentage}%)\n\n`;
            
            if (plan.totalTime) {
                content += `用时: ${TimeUtils.formatTime(Math.floor(plan.totalTime / 1000))}\n\n`;
            }
            
            content += '---\n\n';
        });
        
        content += `导出时间: ${new Date().toLocaleString()}`;
        
        const filename = `计划列表_${DateUtils.getToday()}.txt`;
        ExportUtils.exportAsText(content, filename);
        MessageUtils.showSuccess('计划导出成功');
    }
    
    // 导入数据
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = storage.importData(data);
                    
                    if (success) {
                        // 重新加载数据
                        if (diaryController) {
                            diaryController.loadDiary(diaryController.currentDate);
                        }
                        if (planController) {
                            planController.loadPlans();
                        }
                    }
                } catch (error) {
                    MessageUtils.showError('文件格式错误，请选择有效的备份文件');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // 显示文档
    showDocument(docPath, title) {
        console.log('=== showDocument called ===');
        console.log('DocPath:', docPath);
        console.log('Title:', title);
        console.log('Current location:', window.location.href);
        
        fetch(docPath)
            .then(response => {
                console.log('Fetch response:', response.status, response.statusText);
                if (!response.ok) {
                    throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(content => {
                console.log('Document content loaded successfully, length:', content.length);
                
                // 隐藏所有页面
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                
                // 显示文档页面
                const docPage = document.getElementById('doc-view-page');
                const docTitle = document.getElementById('doc-title');
                const docBody = document.getElementById('doc-body');
                
                console.log('Doc elements found:', {
                    docPage: !!docPage,
                    docTitle: !!docTitle,
                    docBody: !!docBody
                });
                
                if (!docPage || !docTitle || !docBody) {
                    throw new Error('Document page elements not found');
                }
                
                docTitle.textContent = title;
                docBody.innerHTML = this.parseMarkdown(content);
                docPage.classList.add('active');
                
                console.log('Document displayed successfully');
            })
            .catch(error => {
                console.error('Error loading document:', error);
                MessageUtils.showError(`加载文档失败: ${error.message}`);
            });
    }
    
    // 隐藏文档
    hideDocument() {
        const docPage = document.getElementById('doc-view-page');
        docPage.classList.remove('active');
        
        // 返回到之前的页面
        this.showPage(this.currentPage);
    }
    
    // 简单的Markdown解析器
    parseMarkdown(content) {
        // 转义HTML字符
        content = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // 解析Markdown语法
        content = content
            // 标题
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            
            // 粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // 代码块
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            
            // 列表
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            
            // 链接
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
            
            // 换行
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // 处理列表
        content = content.replace(/(<li>.*?<\/li>)/gs, (match) => {
            return '<ul>' + match + '</ul>';
        });
        
        // 处理段落
        content = '<p>' + content + '</p>';
        content = content.replace(/<p><h/g, '<h').replace(/<\/h([1-6])><\/p>/g, '</h$1>');
        content = content.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
        content = content.replace(/<p><pre>/g, '<pre>').replace(/<\/pre><\/p>/g, '</pre>');
        
        return content;
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    window.appController = new AppController();
});

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
    MessageUtils.showError('应用出现错误，请刷新页面重试');
});

// PWA 支持（如果需要）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // 可以在这里注册 Service Worker
        console.log('PWA 支持已准备就绪');
    });
}