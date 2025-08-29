// 工具函数集合

// 日期工具函数
const DateUtils = {
    // 格式化日期为 YYYY-MM-DD
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 解析日期字符串，避免时区问题
    parseDate(dateString) {
        const parts = dateString.split('-');
        if (parts.length !== 3) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    },
    
    // 获取今天的日期
    getToday() {
        return this.formatDate(new Date());
    },
    
    // 获取昨天的日期
    getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.formatDate(yesterday);
    },
    
    // 添加天数
    addDays(dateString, days) {
        const date = this.parseDate(dateString);
        const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
        return this.formatDate(newDate);
    },
    
    // 获取中文格式的日期
    getChineseDate(dateString) {
        const date = this.parseDate(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        return `${year}年${month}月${day}日 星期${weekday}`;
    }
};

// DOM操作工具函数
const DOMUtils = {
    // 创建元素
    createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },
    
    // 清空元素内容
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    // 显示/隐藏元素
    show(element) {
        element.style.display = '';
    },
    
    hide(element) {
        element.style.display = 'none';
    },
    
    // 切换类名
    toggleClass(element, className) {
        element.classList.toggle(className);
    },
    
    // 添加事件监听器
    on(element, event, handler) {
        element.addEventListener(event, handler);
    },
    
    // 移除事件监听器
    off(element, event, handler) {
        element.removeEventListener(event, handler);
    }
};

// 字符串工具函数
const StringUtils = {
    // 生成随机ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 截断文本
    truncate(text, length = 50) {
        if (text.length <= length) return text;
        return text.substr(0, length) + '...';
    },
    
    // 清理空白字符
    trim(text) {
        return text.replace(/^\s+|\s+$/g, '');
    }
};

// 时间工具函数
const TimeUtils = {
    // 格式化时间为 HH:MM:SS
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // 解析时间字符串为秒数
    parseTime(timeString) {
        const parts = timeString.split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    },
    
    // 获取当前时间戳
    now() {
        return Math.floor(Date.now() / 1000);
    }
};

// 导出工具函数
const ExportUtils = {
    // 导出为JSON文件
    exportAsJson(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        this.downloadFile(jsonString, filename, 'application/json');
    },
    
    // 导出为文本文件
    exportAsText(text, filename) {
        this.downloadFile(text, filename, 'text/plain');
    },
    
    // 下载文件
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// 验证工具函数
const ValidationUtils = {
    // 验证邮箱
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // 验证非空字符串
    isNotEmpty(str) {
        return str && str.trim().length > 0;
    },
    
    // 验证数字
    isNumber(value) {
        return !isNaN(value) && isFinite(value);
    },
    
    // 验证日期
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
};

// 消息提示工具
const MessageUtils = {
    // 显示成功消息
    showSuccess(message, duration = 3000) {
        this.showMessage(message, 'success', duration);
    },
    
    // 显示错误消息
    showError(message, duration = 5000) {
        this.showMessage(message, 'error', duration);
    },
    
    // 显示信息消息
    showInfo(message, duration = 3000) {
        this.showMessage(message, 'info', duration);
    },
    
    // 显示消息
    showMessage(message, type = 'info', duration = 3000) {
        // 移除已存在的消息
        const existing = document.querySelector('.toast-message');
        if (existing) {
            existing.remove();
        }
        
        // 创建消息元素
        const messageEl = DOMUtils.createElement('div', `toast-message toast-${type}`, message);
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--soft-green);
            color: var(--dark-brown);
            padding: var(--spacing-md);
            border-radius: var(--border-radius-small);
            box-shadow: 0 4px 12px var(--shadow-medium);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        if (type === 'error') {
            messageEl.style.background = '#d4746a';
            messageEl.style.color = 'white';
        }
        
        document.body.appendChild(messageEl);
        
        // 自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => {
                    messageEl.remove();
                }, 300);
            }
        }, duration);
        
        // 添加动画样式
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// 确认对话框工具
const ConfirmUtils = {
    // 显示确认对话框
    confirm(title, message, onConfirm, onCancel) {
        const modal = document.getElementById('confirm-dialog');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        // 清除之前的事件监听器
        const newYesBtn = yesBtn.cloneNode(true);
        const newNoBtn = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        noBtn.parentNode.replaceChild(newNoBtn, noBtn);
        
        // 添加新的事件监听器
        newYesBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            if (onConfirm) onConfirm();
        });
        
        newNoBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            if (onCancel) onCancel();
        });
        
        // 显示对话框
        modal.style.display = 'block';
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (onCancel) onCancel();
            }
        });
    }
};

// 模态框工具
const ModalUtils = {
    // 显示模态框
    show(content, title = '') {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        const closeBtn = modal.querySelector('.close');
        
        // 设置内容
        if (title) {
            modalBody.innerHTML = `<h3>${title}</h3>${content}`;
        } else {
            modalBody.innerHTML = content;
        }
        
        // 显示模态框
        modal.style.display = 'block';
        
        // 关闭按钮事件
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        
        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        return modal;
    },
    
    // 隐藏模态框
    hide() {
        const modal = document.getElementById('modal');
        modal.style.display = 'none';
    }
};

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}