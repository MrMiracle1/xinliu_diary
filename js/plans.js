// 计划功能管理器
class PlanController {
    constructor() {
        this.currentPlan = null;
        this.editingPlan = null;
        this.executingPlan = null;
        this.currentExecutionDate = DateUtils.getToday(); // 当前执行日期
        this.timer = null;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.loadPlans();
    }
    
    // 初始化DOM元素
    initializeElements() {
        this.elements = {
            // 计划列表页面
            planList: document.getElementById('plan-list'),
            addPlan: document.getElementById('add-plan'),
            
            // 计划编辑页面
            planEditTitle: document.getElementById('plan-edit-title'),
            planName: document.getElementById('plan-name'),
            tasksList: document.getElementById('tasks-list'),
            addTask: document.getElementById('add-task'),
            savePlan: document.getElementById('save-plan'),
            deletePlan: document.getElementById('delete-plan'),
            backToPlans: document.getElementById('back-to-plans'),
            
            // 常用工作项相关
            showCommonTasks: document.getElementById('show-common-tasks'),
            commonTasksDropdown: document.getElementById('common-tasks-dropdown'),
            commonTasksList: document.getElementById('common-tasks-list'),
            manageCommonTasks: document.getElementById('manage-common-tasks'),
            commonTasksModal: document.getElementById('common-tasks-modal'),
            newCommonTask: document.getElementById('new-common-task'),
            addCommonTask: document.getElementById('add-common-task'),
            manageCommonTasksList: document.getElementById('manage-common-tasks-list'),
            
            // 计划执行页面
            executePlanTitle: document.getElementById('execute-plan-title'),
            timer: document.getElementById('timer'),
            executeTasks: document.getElementById('execute-tasks'),
            pausePlan: document.getElementById('pause-plan'),
            stopPlan: document.getElementById('stop-plan'),
            backToPlansExec: document.getElementById('back-to-plans-exec'),
            
            // 页面容器
            planPage: document.getElementById('plan-page'),
            planEditPage: document.getElementById('plan-edit-page'),
            planExecutePage: document.getElementById('plan-execute-page')
        };
    }
    
    // 绑定事件
    bindEvents() {
        // 计划列表页面
        this.elements.addPlan.addEventListener('click', () => {
            this.createNewPlan();
        });
        
        // 计划编辑页面
        this.elements.addTask.addEventListener('click', () => {
            this.addTask();
        });
        
        this.elements.savePlan.addEventListener('click', () => {
            this.savePlan();
        });
        
        this.elements.deletePlan.addEventListener('click', () => {
            this.deletePlan();
        });
        
        this.elements.backToPlans.addEventListener('click', () => {
            this.showPlanList();
        });
        
        // 计划执行页面
        this.elements.pausePlan.addEventListener('click', () => {
            this.togglePause();
        });
        
        this.elements.stopPlan.addEventListener('click', () => {
            this.stopExecution();
        });
        
        this.elements.backToPlansExec.addEventListener('click', () => {
            this.showPlanList();
        });
        
        // 计划名称输入
        this.elements.planName.addEventListener('input', debounce(() => {
            if (this.editingPlan) {
                this.editingPlan.name = this.elements.planName.value;
            }
        }, 300));
        
        // 常用工作项相关事件
        this.elements.showCommonTasks.addEventListener('click', () => {
            this.toggleCommonTasksDropdown();
        });
        
        this.elements.manageCommonTasks.addEventListener('click', () => {
            this.showCommonTasksModal();
        });
        
        this.elements.addCommonTask.addEventListener('click', () => {
            this.addNewCommonTask();
        });
        
        this.elements.newCommonTask.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewCommonTask();
            }
        });
        
        // 点击外部关闭下拉框
        document.addEventListener('click', (e) => {
            if (!this.elements.showCommonTasks.contains(e.target) && 
                !this.elements.commonTasksDropdown.contains(e.target)) {
                this.elements.commonTasksDropdown.classList.remove('active');
            }
        });
    }
    
    // 加载计划列表
    loadPlans() {
        const plans = planManager.getPlans();
        this.renderPlanList(plans);
    }
    
    // 渲染计划列表
    renderPlanList(plans) {
        DOMUtils.clearElement(this.elements.planList);
        
        if (plans.length === 0) {
            this.elements.planList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>还没有创建任何计划</p>
                    <p>点击"新建计划"开始制定你的第一个计划吧！</p>
                </div>
            `;
            return;
        }
        
        plans.forEach(plan => {
            const planCard = this.createPlanCard(plan);
            this.elements.planList.appendChild(planCard);
        });
    }
    
    // 创建计划卡片
    createPlanCard(plan) {
        const today = DateUtils.getToday();
        const todayExecution = planManager.getPlanExecution(plan.id, today);
        const progress = planManager.getPlanProgress(plan, today);
        
        let statusText, statusClass, actionButtons;
        
        if (todayExecution) {
            switch (todayExecution.status) {
                case 'active':
                    statusText = '今日执行中';
                    statusClass = 'status-active';
                    actionButtons = `<button class="action-btn" onclick="planController.resumeExecution('${plan.id}')">继续</button>`;
                    break;
                case 'completed':
                    statusText = '今日已完成';
                    statusClass = 'status-completed';
                    actionButtons = `<button class="action-btn" onclick="planController.viewExecutionHistory('${plan.id}')">查看记录</button>`;
                    break;
                case 'stopped':
                    statusText = '今日已停止';
                    statusClass = 'status-stopped';
                    actionButtons = `<button class="action-btn" onclick="planController.startExecution('${plan.id}')">重新开始</button>`;
                    break;
            }
        } else {
            statusText = '今日未开始';
            statusClass = 'status-pending';
            actionButtons = `<button class="action-btn" onclick="planController.startExecution('${plan.id}')">开始执行</button>`;
        }
        
        const planCard = DOMUtils.createElement('div', 'plan-card');
        planCard.innerHTML = `
            <div class="plan-card-header">
                <h3 class="plan-title">${StringUtils.escapeHtml(plan.name || '未命名计划')}</h3>
                <div class="plan-actions">
                    <button class="action-btn" onclick="planController.editPlan('${plan.id}')">编辑</button>
                    ${actionButtons}
                    <button class="action-btn danger" onclick="planController.deletePlanConfirm('${plan.id}')">删除</button>
                </div>
            </div>
            <div class="plan-info">
                <span class="plan-status ${statusClass}">${statusText}</span>
                <span class="plan-tasks">${progress.completed}/${progress.total} 任务</span>
                ${todayExecution && todayExecution.totalTime ? `<span class="plan-time">${TimeUtils.formatTime(Math.floor(todayExecution.totalTime / 1000))}</span>` : ''}
            </div>
            <div class="plan-progress">
                <div class="plan-progress-bar" style="width: ${progress.percentage}%"></div>
            </div>
            <div class="plan-today-label">今日情况 (${DateUtils.getChineseDate(today)})</div>
        `;
        
        return planCard;
    }
    
    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'draft': '草稿',
            'active': '进行中',
            'completed': '已完成',
            'stopped': '已停止'
        };
        return statusMap[status] || '未知';
    }
    
    // 创建新计划
    createNewPlan() {
        this.editingPlan = planManager.createEmptyPlan();
        this.showPlanEdit();
    }
    
    // 编辑计划
    editPlan(id) {
        this.editingPlan = planManager.getPlan(id);
        if (this.editingPlan) {
            this.showPlanEdit();
        }
    }
    
    // 删除计划确认
    deletePlanConfirm(id) {
        const plan = planManager.getPlan(id);
        if (!plan) return;
        
        ConfirmUtils.confirm(
            '删除计划',
            `确定要删除计划"${plan.name}"吗？此操作无法撤销。`,
            () => {
                const success = planManager.deletePlan(id);
                if (success) {
                    this.loadPlans();
                    MessageUtils.showSuccess('计划已删除');
                } else {
                    MessageUtils.showError('删除计划失败');
                }
            }
        );
    }
    
    // 显示计划列表
    showPlanList() {
        this.hideAllPages();
        this.elements.planPage.classList.add('active');
        this.loadPlans();
        
        // 停止执行中的计时器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    // 显示计划编辑页面
    showPlanEdit() {
        this.hideAllPages();
        this.elements.planEditPage.classList.add('active');
        
        if (this.editingPlan) {
            this.elements.planEditTitle.textContent = this.editingPlan.id ? '编辑计划' : '新建计划';
            this.elements.planName.value = this.editingPlan.name || '';
            this.renderTasksList();
            
            // 根据计划状态显示/隐藏删除按钮
            if (this.editingPlan.id) {
                this.elements.deletePlan.style.display = 'inline-block';
            } else {
                this.elements.deletePlan.style.display = 'none';
            }
        }
    }
    
    // 显示计划执行页面
    showPlanExecute() {
        this.hideAllPages();
        this.elements.planExecutePage.classList.add('active');
        
        if (this.executingPlan) {
            this.elements.executePlanTitle.textContent = this.executingPlan.name || '执行计划';
            this.renderExecuteTasks();
            this.startTimer();
        }
    }
    
    // 隐藏所有页面
    hideAllPages() {
        this.elements.planPage.classList.remove('active');
        this.elements.planEditPage.classList.remove('active');
        this.elements.planExecutePage.classList.remove('active');
    }
    
    // 渲染任务列表
    renderTasksList() {
        DOMUtils.clearElement(this.elements.tasksList);
        
        if (this.editingPlan.tasks.length === 0) {
            this.elements.tasksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>还没有添加任务</p>
                </div>
            `;
            return;
        }
        
        this.editingPlan.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.elements.tasksList.appendChild(taskElement);
        });
    }
    
    // 创建任务元素
    createTaskElement(task) {
        const taskDiv = DOMUtils.createElement('div', 'task-item');
        
        // 检查文本是否过长
        const isLongText = task.text.length > 50;
        const needsExpansion = isLongText;
        
        taskDiv.innerHTML = `
            <input type="text" value="${StringUtils.escapeHtml(task.text)}" 
                   placeholder="输入任务内容..." 
                   data-id="${task.id}"
                   title="${needsExpansion ? StringUtils.escapeHtml(task.text) : ''}">
            ${needsExpansion ? '<button class="text-expand-btn" onclick="planController.toggleTextExpansion(this)">...</button>' : ''}
            <label class="task-required-label">
                <input type="checkbox" class="task-required" ${task.required ? 'checked' : ''} 
                       onchange="planController.updateTaskRequired('${task.id}', this.checked)">
                必需
            </label>
            <button class="item-btn danger" onclick="planController.removeTask('${task.id}')">删除</button>
        `;
        
        // 绑定输入事件
        const input = taskDiv.querySelector('input[type="text"]');
        input.addEventListener('input', debounce(() => {
            this.updateTaskText(task.id, input.value);
            this.updateTextExpansionButton(taskDiv, input.value);
        }, 300));
        
        // 添加悬停提示功能
        if (needsExpansion) {
            this.addTextTooltip(input);
        }
        
        return taskDiv;
    }
    
    // 渲染执行任务列表
    renderExecuteTasks() {
        DOMUtils.clearElement(this.elements.executeTasks);
        
        const execution = planManager.getPlanExecution(this.executingPlan.id, this.currentExecutionDate);
        const tasks = execution ? execution.tasks : this.executingPlan.tasks;
        
        tasks.forEach(task => {
            const taskElement = this.createExecuteTaskElement(task);
            this.elements.executeTasks.appendChild(taskElement);
        });
    }
    
    // 创建执行任务元素
    createExecuteTaskElement(task) {
        const taskDiv = DOMUtils.createElement('div', 'execute-task');
        if (task.completed) {
            taskDiv.classList.add('completed');
        }
        if (task.required) {
            taskDiv.classList.add('required');
        }
        
        taskDiv.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="planController.toggleExecuteTask('${task.id}')">
            <span class="task-text">${StringUtils.escapeHtml(task.text)}</span>
            ${task.required ? '<span class="task-badge">必需</span>' : ''}
            ${task.completedAt ? `<span class="task-time">${new Date(task.completedAt).toLocaleTimeString()}</span>` : ''}
        `;
        
        return taskDiv;
    }
    
    // 添加任务
    addTask(text = '') {
        const task = planManager.createEmptyTask();
        task.text = text;
        
        this.editingPlan.tasks.push(task);
        this.renderTasksList();
        
        // 聚焦到新添加的输入框
        setTimeout(() => {
            const inputs = this.elements.tasksList.querySelectorAll('input[type="text"]');
            const lastInput = inputs[inputs.length - 1];
            if (lastInput) {
                lastInput.focus();
            }
        }, 100);
    }
    
    // 更新任务文本
    updateTaskText(id, text) {
        const task = this.editingPlan.tasks.find(t => t.id === id);
        if (task) {
            task.text = text;
        }
    }
    
    // 更新任务必需状态
    updateTaskRequired(id, required) {
        const task = this.editingPlan.tasks.find(t => t.id === id);
        if (task) {
            task.required = required;
        }
    }
    
    // 文本展开/折叠功能
    toggleTextExpansion(button) {
        const taskItem = button.closest('.task-item');
        const input = taskItem.querySelector('input[type="text"]');
        
        if (taskItem.classList.contains('text-expanded')) {
            // 折叠文本
            taskItem.classList.remove('text-expanded');
            button.textContent = '...';
            button.title = '展开文本';
        } else {
            // 展开文本
            taskItem.classList.add('text-expanded');
            button.textContent = '收起';
            button.title = '收起文本';
        }
    }
    
    // 更新文本展开按钮
    updateTextExpansionButton(container, text) {
        const isLongText = text.length > 50;
        const expandBtn = container.querySelector('.text-expand-btn');
        const input = container.querySelector('input[type="text"]');
        
        if (isLongText && !expandBtn) {
            // 添加展开按钮
            const newBtn = document.createElement('button');
            newBtn.className = 'text-expand-btn';
            newBtn.textContent = '...';
            newBtn.title = '展开文本';
            newBtn.onclick = () => this.toggleTextExpansion(newBtn);
            
            input.insertAdjacentElement('afterend', newBtn);
            input.title = text;
            this.addTextTooltip(input);
        } else if (!isLongText && expandBtn) {
            // 移除展开按钮
            expandBtn.remove();
            input.title = '';
            container.classList.remove('text-expanded');
            this.removeTextTooltip(input);
        } else if (isLongText && expandBtn) {
            // 更新提示
            input.title = text;
        }
    }
    
    // 添加文本提示
    addTextTooltip(input) {
        let tooltip = null;
        
        input.addEventListener('mouseenter', (e) => {
            if (input.value.length <= 50) return;
            
            // 移除现有提示
            this.removeTextTooltip(input);
            
            tooltip = document.createElement('div');
            tooltip.className = 'text-tooltip';
            tooltip.textContent = input.value;
            
            // 定位提示
            const rect = input.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 + 'px';
            tooltip.style.top = rect.top - 10 + 'px';
            
            document.body.appendChild(tooltip);
            
            // 展示提示
            setTimeout(() => {
                if (tooltip) {
                    tooltip.classList.add('visible');
                }
            }, 100);
        });
        
        input.addEventListener('mouseleave', () => {
            this.removeTextTooltip(input);
        });
    }
    
    // 移除文本提示
    removeTextTooltip(input) {
        const existingTooltips = document.querySelectorAll('.text-tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());
    }
    
    // 删除任务
    removeTask(id) {
        const index = this.editingPlan.tasks.findIndex(t => t.id === id);
        if (index >= 0) {
            this.editingPlan.tasks.splice(index, 1);
            this.renderTasksList();
        }
    }
    
    // 保存计划
    savePlan() {
        if (!this.editingPlan) return;
        
        // 验证计划名称
        if (!ValidationUtils.isNotEmpty(this.editingPlan.name)) {
            MessageUtils.showError('请输入计划名称');
            this.elements.planName.focus();
            return;
        }
        
        // 验证任务
        if (this.editingPlan.tasks.length === 0) {
            MessageUtils.showError('请至少添加一个任务');
            return;
        }
        
        // 检查任务是否有空的
        const emptyTasks = this.editingPlan.tasks.filter(task => !ValidationUtils.isNotEmpty(task.text));
        if (emptyTasks.length > 0) {
            MessageUtils.showError('请填写所有任务内容');
            return;
        }
        
        const success = planManager.savePlan(this.editingPlan);
        if (success) {
            MessageUtils.showSuccess('计划保存成功');
            this.showPlanList();
        } else {
            MessageUtils.showError('保存计划失败');
        }
    }
    
    // 删除计划
    deletePlan() {
        if (!this.editingPlan || !this.editingPlan.id) return;
        
        ConfirmUtils.confirm(
            '删除计划',
            `确定要删除计划"${this.editingPlan.name}"吗？此操作无法撤销。`,
            () => {
                const success = planManager.deletePlan(this.editingPlan.id);
                if (success) {
                    MessageUtils.showSuccess('计划已删除');
                    this.showPlanList();
                } else {
                    MessageUtils.showError('删除计划失败');
                }
            }
        );
    }
    
    // 开始执行计划
    startExecution(id) {
        const plan = planManager.getPlan(id);
        if (!plan) return;
        
        // 检查是否有任务
        if (plan.tasks.length === 0) {
            MessageUtils.showError('计划中没有任务，请先编辑计划添加任务');
            return;
        }
        
        this.currentExecutionDate = DateUtils.getToday();
        this.executingPlan = planManager.startPlan(id, this.currentExecutionDate);
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.showPlanExecute();
    }
    
    // 继续执行计划
    resumeExecution(id) {
        const plan = planManager.getPlan(id);
        if (!plan) return;
        
        this.currentExecutionDate = DateUtils.getToday();
        const execution = planManager.getPlanExecution(id, this.currentExecutionDate);
        
        if (!execution) {
            this.startExecution(id);
            return;
        }
        
        this.executingPlan = plan;
        this.startTime = Date.now();
        this.elapsedTime = execution.totalTime || 0;
        this.showPlanExecute();
    }
    
    // 切换执行任务状态
    toggleExecuteTask(taskId) {
        if (!this.executingPlan) return;
        
        const execution = planManager.getPlanExecution(this.executingPlan.id, this.currentExecutionDate);
        if (!execution) return;
        
        const task = execution.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (task.completed) {
            // 取消完成
            task.completed = false;
            task.completedAt = null;
            planManager.savePlan(this.executingPlan);
        } else {
            // 标记完成
            planManager.completeTask(this.executingPlan.id, taskId, this.currentExecutionDate);
            this.executingPlan = planManager.getPlan(this.executingPlan.id);
        }
        
        this.renderExecuteTasks();
        
        // 检查是否所有任务都完成了
        const updatedExecution = planManager.getPlanExecution(this.executingPlan.id, this.currentExecutionDate);
        if (updatedExecution) {
            const allCompleted = updatedExecution.tasks.every(t => t.completed);
            if (allCompleted) {
                this.completeExecution();
            }
        }
    }

    // 启动计时器
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            const currentTime = Date.now();
            const sessionTime = currentTime - this.startTime;
            const totalTime = this.elapsedTime + sessionTime;
            
            this.elements.timer.textContent = TimeUtils.formatTime(Math.floor(totalTime / 1000));
        }, 1000);
    }
    
    // 切换暂停状态
    togglePause() {
        if (this.timer) {
            // 暂停
            clearInterval(this.timer);
            this.timer = null;
            this.elapsedTime += Date.now() - this.startTime;
            this.elements.pausePlan.textContent = '继续';
            MessageUtils.showInfo('计划已暂停');
        } else {
            // 继续
            this.startTime = Date.now();
            this.startTimer();
            this.elements.pausePlan.textContent = '暂停';
            MessageUtils.showInfo('计划已继续');
        }
    }
    
    // 停止执行
    stopExecution() {
        if (!this.executingPlan) return;
        
        const incompleteRequired = planManager.getIncompleteRequiredTasks(this.executingPlan);
        
        let message = '确定要强制终止计划吗？';
        if (incompleteRequired.length > 0) {
            message += `\n\n以下必需任务尚未完成：\n${incompleteRequired.map(t => `• ${t.text}`).join('\n')}`;
        }
        
        ConfirmUtils.confirm(
            '强制终止计划',
            message,
            () => {
                // 停止计时器
                if (this.timer) {
                    clearInterval(this.timer);
                    this.timer = null;
                }
                
                // 更新计划状态
                this.elapsedTime += Date.now() - this.startTime;
                planManager.stopPlan(this.executingPlan.id);
                
                MessageUtils.showInfo('计划已终止');
                this.showPlanList();
            }
        );
    }
    
    // 完成执行
    completeExecution() {
        if (!this.executingPlan) return;
        
        // 停止计时器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 计算总时间
        this.elapsedTime += Date.now() - this.startTime;
        
        // 更新计划状态
        planManager.completePlan(this.executingPlan.id, this.currentExecutionDate);
        
        // 显示完成对话框
        const execution = planManager.getPlanExecution(this.executingPlan.id, this.currentExecutionDate);
        const progress = planManager.getPlanProgress(this.executingPlan, this.currentExecutionDate);
        const timeText = TimeUtils.formatTime(Math.floor(this.elapsedTime / 1000));
        
        const content = `
            <div class="completion-summary">
                <div class="completion-icon">🎉</div>
                <h3>恭喜！计划已完成</h3>
                <div class="completion-stats">
                    <div class="stat-item">
                        <span class="stat-label">计划名称</span>
                        <span class="stat-value">${this.executingPlan.name}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">完成任务</span>
                        <span class="stat-value">${progress.completed}/${progress.total}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">用时</span>
                        <span class="stat-value">${timeText}</span>
                    </div>
                </div>
                <button class="action-btn" onclick="planController.showPlanList(); ModalUtils.hide();">返回计划列表</button>
            </div>
        `;
        
        ModalUtils.show(content);
        
        // 添加完成样式
        if (!document.querySelector('#completion-styles')) {
            const style = document.createElement('style');
            style.id = 'completion-styles';
            style.textContent = `
                .completion-summary {
                    text-align: center;
                    padding: var(--spacing-lg);
                }
                .completion-icon {
                    font-size: 48px;
                    margin-bottom: var(--spacing-md);
                }
                .completion-stats {
                    margin: var(--spacing-lg) 0;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: var(--spacing-sm);
                    padding: var(--spacing-sm) 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .stat-label {
                    color: var(--text-secondary);
                }
                .stat-value {
                    font-weight: 600;
                    color: var(--dark-brown);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 查看执行记录
    viewExecutionHistory(id) {
        const plan = planManager.getPlan(id);
        if (!plan) {
            MessageUtils.showError('计划不存在');
            return;
        }
        
        const history = planManager.getPlanExecutionHistory(id);
        if (!history || history.length === 0) {
            MessageUtils.showInfo('还没有执行记录');
            return;
        }
        
        let content = `
            <div class="execution-history">
                <h3>${plan.name} - 执行记录</h3>
                <div class="history-list">
        `;
        
        history.forEach(record => {
            const statusText = this.getExecutionStatusText(record.status);
            const statusClass = `status-${record.status}`;
            const dateText = DateUtils.getChineseDate(record.date);
            const timeText = record.totalTime ? TimeUtils.formatTime(Math.floor(record.totalTime / 1000)) : '未记录';
            const completedTasks = record.tasks ? record.tasks.filter(t => t.completed).length : 0;
            const totalTasks = record.tasks ? record.tasks.length : 0;
            
            content += `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-date">${dateText}</span>
                        <span class="history-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="history-details">
                        <div class="history-stat">
                            <span class="stat-label">任务完成:</span>
                            <span class="stat-value">${completedTasks}/${totalTasks}</span>
                        </div>
                        <div class="history-stat">
                            <span class="stat-label">用时:</span>
                            <span class="stat-value">${timeText}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        content += `
                </div>
                <div class="history-actions">
                    <button class="action-btn" onclick="ModalUtils.hide();">关闭</button>
                </div>
            </div>
        `;
        
        ModalUtils.show(content);
        
        // 添加历史记录样式
        if (!document.querySelector('#history-styles')) {
            const style = document.createElement('style');
            style.id = 'history-styles';
            style.textContent = `
                .execution-history {
                    max-width: 500px;
                    margin: 0 auto;
                }
                .execution-history h3 {
                    text-align: center;
                    margin-bottom: var(--spacing-lg);
                    color: var(--dark-brown);
                }
                .history-list {
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: var(--spacing-lg);
                }
                .history-item {
                    background: var(--light-gray);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-small);
                    padding: var(--spacing-md);
                    margin-bottom: var(--spacing-sm);
                }
                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-sm);
                }
                .history-date {
                    font-weight: 600;
                    color: var(--dark-brown);
                }
                .history-status {
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: var(--border-radius-small);
                    font-size: var(--font-size-xs);
                    font-weight: 600;
                }
                .history-status.status-completed {
                    background: var(--soft-green);
                    color: var(--dark-brown);
                }
                .history-status.status-stopped {
                    background: var(--accent-orange);
                    color: var(--cream-white);
                }
                .history-status.status-active {
                    background: var(--soft-brown);
                    color: var(--cream-white);
                }
                .history-details {
                    display: flex;
                    gap: var(--spacing-lg);
                }
                .history-stat {
                    display: flex;
                    gap: var(--spacing-xs);
                }
                .history-stat .stat-label {
                    color: var(--text-secondary);
                    font-size: var(--font-size-sm);
                }
                .history-stat .stat-value {
                    color: var(--dark-brown);
                    font-weight: 600;
                    font-size: var(--font-size-sm);
                }
                .history-actions {
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 获取执行状态文本
    getExecutionStatusText(status) {
        const statusMap = {
            'active': '执行中',
            'completed': '已完成',
            'stopped': '已停止'
        };
        return statusMap[status] || '未知';
    }
    
    // 切换常用工作项下拉框
    toggleCommonTasksDropdown() {
        this.elements.commonTasksDropdown.classList.toggle('active');
        if (this.elements.commonTasksDropdown.classList.contains('active')) {
            this.loadCommonTasksDropdown();
        }
    }
    
    // 加载常用工作项下拉列表
    loadCommonTasksDropdown() {
        const commonTasks = planManager.getCommonTasks();
        DOMUtils.clearElement(this.elements.commonTasksList);
        
        if (commonTasks.length === 0) {
            this.elements.commonTasksList.innerHTML = `
                <div class="common-task-item">
                    <span class="common-task-text">暂无常用工作项</span>
                </div>
            `;
            return;
        }
        
        commonTasks.forEach(task => {
            const taskItem = DOMUtils.createElement('div', 'common-task-item');
            taskItem.innerHTML = `
                <span class="common-task-text">${StringUtils.escapeHtml(task.text)}</span>
                <button class="common-task-add-btn" onclick="planController.addTaskFromCommon('${task.id}')">添加</button>
            `;
            this.elements.commonTasksList.appendChild(taskItem);
        });
    }
    
    // 从常用工作项添加任务
    addTaskFromCommon(taskId) {
        const commonTasks = planManager.getCommonTasks();
        const commonTask = commonTasks.find(t => t.id === taskId);
        
        if (commonTask) {
            this.addTask(commonTask.text);
            this.elements.commonTasksDropdown.classList.remove('active');
            MessageUtils.showSuccess('已添加常用工作项');
        }
    }
    
    // 显示常用工作项管理模态框
    showCommonTasksModal() {
        this.elements.commonTasksModal.style.display = 'block';
        this.loadManageCommonTasksList();
        
        // 关闭按钮事件
        const closeBtn = this.elements.commonTasksModal.querySelector('.close');
        closeBtn.onclick = () => {
            this.elements.commonTasksModal.style.display = 'none';
        };
        
        // 点击背景关闭
        this.elements.commonTasksModal.onclick = (e) => {
            if (e.target === this.elements.commonTasksModal) {
                this.elements.commonTasksModal.style.display = 'none';
            }
        };
    }
    
    // 加载管理常用工作项列表
    loadManageCommonTasksList() {
        const commonTasks = planManager.getCommonTasks();
        DOMUtils.clearElement(this.elements.manageCommonTasksList);
        
        if (commonTasks.length === 0) {
            this.elements.manageCommonTasksList.innerHTML = `
                <div class="manage-common-task-item">
                    <span class="manage-common-task-text">暂无常用工作项</span>
                </div>
            `;
            return;
        }
        
        commonTasks.forEach(task => {
            const taskItem = DOMUtils.createElement('div', 'manage-common-task-item');
            taskItem.innerHTML = `
                <span class="manage-common-task-text">${StringUtils.escapeHtml(task.text)}</span>
                <button class="delete-common-task" onclick="planController.deleteCommonTask('${task.id}')">删除</button>
            `;
            this.elements.manageCommonTasksList.appendChild(taskItem);
        });
    }
    
    // 添加新的常用工作项
    addNewCommonTask() {
        const text = this.elements.newCommonTask.value.trim();
        if (!text) {
            MessageUtils.showError('请输入工作项内容');
            return;
        }
        
        planManager.addCommonTask(text);
        this.elements.newCommonTask.value = '';
        this.loadManageCommonTasksList();
        MessageUtils.showSuccess('常用工作项已添加');
    }
    
    // 删除常用工作项
    deleteCommonTask(id) {
        ConfirmUtils.confirm(
            '删除常用工作项',
            '确定要删除这个常用工作项吗？',
            () => {
                const success = planManager.removeCommonTask(id);
                if (success) {
                    this.loadManageCommonTasksList();
                    MessageUtils.showSuccess('常用工作项已删除');
                } else {
                    MessageUtils.showError('删除失败');
                }
            }
        );
    }
}

// 初始化计划控制器
let planController;