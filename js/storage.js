// 数据存储管理器
class StorageManager {
    constructor() {
        this.prefix = 'daily_journal_';
        this.keys = {
            diaries: 'diaries',
            plans: 'plans',
            commonTasks: 'commonTasks', // 常用工作项
            globalEvents: 'globalEvents', // 全局大事件
            eventAssociations: 'eventAssociations', // 事件日期关联
            settings: 'settings'
        };
        
        // 初始化默认设置
        this.initDefaultSettings();
    }
    
    // 初始化默认设置
    initDefaultSettings() {
        const defaultSettings = {
            deviceMode: 'auto', // auto, mobile, desktop
            theme: 'light', // light, dark
            autoSave: true,
            exportFormat: 'json' // json, txt
        };
        
        if (!this.get(this.keys.settings)) {
            this.set(this.keys.settings, defaultSettings);
        }
    }
    
    // 获取存储的数据
    get(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('获取存储数据失败:', error);
            return null;
        }
    }
    
    // 保存数据到存储
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            MessageUtils.showError('保存数据失败，可能是存储空间不足');
            return false;
        }
    }
    
    // 删除存储的数据
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }
    
    // 清空所有数据
    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                this.remove(key);
            });
            // 重新初始化默认设置
            this.initDefaultSettings();
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
    
    // 获取存储使用情况
    getStorageInfo() {
        let total = 0;
        Object.values(this.keys).forEach(key => {
            const data = localStorage.getItem(this.prefix + key);
            if (data) {
                total += data.length;
            }
        });
        
        return {
            used: total,
            usedMB: (total / 1024 / 1024).toFixed(2)
        };
    }
    
    // 导出所有数据
    exportAllData() {
        const data = {};
        Object.values(this.keys).forEach(key => {
            data[key] = this.get(key);
        });
        
        data.exportDate = new Date().toISOString();
        data.version = '1.0';
        
        return data;
    }
    
    // 导入数据
    importData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('无效的数据格式');
            }
            
            // 验证数据结构
            const requiredKeys = Object.values(this.keys);
            const hasValidStructure = requiredKeys.some(key => data.hasOwnProperty(key));
            
            if (!hasValidStructure) {
                throw new Error('数据格式不兼容');
            }
            
            // 备份当前数据
            const backup = this.exportAllData();
            
            // 导入新数据
            Object.values(this.keys).forEach(key => {
                if (data[key]) {
                    this.set(key, data[key]);
                }
            });
            
            MessageUtils.showSuccess('数据导入成功');
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            MessageUtils.showError('导入数据失败: ' + error.message);
            return false;
        }
    }
}

// 日记数据管理器
class DiaryManager {
    constructor(storage) {
        this.storage = storage;
        this.currentDate = DateUtils.getToday();
    }
    
    // 获取指定日期的日记
    getDiary(date) {
        const diaries = this.storage.get(this.storage.keys.diaries) || {};
        return diaries[date] || this.createEmptyDiary();
    }
    
    // 创建空日记结构
    createEmptyDiary() {
        return {
            majorEvents: [],
            todos: [],
            completed: [],
            reflection: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
    
    // 保存日记
    saveDiary(date, diary) {
        const diaries = this.storage.get(this.storage.keys.diaries) || {};
        diary.updatedAt = new Date().toISOString();
        diaries[date] = diary;
        
        return this.storage.set(this.storage.keys.diaries, diaries);
    }
    
    // 删除指定日期的日记
    deleteDiary(date) {
        const diaries = this.storage.get(this.storage.keys.diaries) || {};
        delete diaries[date];
        return this.storage.set(this.storage.keys.diaries, diaries);
    }
    
    // 获取所有日记日期
    getAllDiaryDates() {
        const diaries = this.storage.get(this.storage.keys.diaries) || {};
        return Object.keys(diaries).sort().reverse();
    }
    
    // 获取所有日记数据
    getAllDiaries() {
        return this.storage.get(this.storage.keys.diaries) || {};
    }
    
    // 搜索日记
    searchDiaries(keyword) {
        const diaries = this.storage.get(this.storage.keys.diaries) || {};
        const results = [];
        
        Object.entries(diaries).forEach(([date, diary]) => {
            const searchText = [
                ...diary.majorEvents.map(e => e.text),
                ...diary.todos.map(t => t.text),
                ...diary.completed.map(c => c.text),
                diary.reflection
            ].join(' ').toLowerCase();
            
            if (searchText.includes(keyword.toLowerCase())) {
                results.push({ date, diary });
            }
        });
        
        return results.sort((a, b) => b.date.localeCompare(a.date));
    }
    
    // 继承昨天的大事件
    inheritYesterdayEvents(date) {
        const yesterday = DateUtils.addDays(date, -1);
        const yesterdayDiary = this.getDiary(yesterday);
        
        if (yesterdayDiary.majorEvents.length > 0) {
            return yesterdayDiary.majorEvents.map(event => ({
                id: StringUtils.generateId(),
                text: event.text,
                completed: false,
                createdAt: new Date().toISOString()
            }));
        }
        
        return [];
    }
    
    // 获取统计信息
    getStatistics() {
        const diaries = this.storage.get(this.storage.keys.diaries) || {};
        const dates = Object.keys(diaries);
        
        let totalTodos = 0;
        let totalCompleted = 0;
        let totalReflectionLength = 0;
        
        dates.forEach(date => {
            const diary = diaries[date];
            totalTodos += diary.todos.length;
            totalCompleted += diary.completed.length;
            totalReflectionLength += diary.reflection.length;
        });
        
        return {
            totalDays: dates.length,
            totalTodos,
            totalCompleted,
            averageReflectionLength: Math.round(totalReflectionLength / Math.max(dates.length, 1)),
            firstDiary: dates.sort()[0],
            lastDiary: dates.sort().reverse()[0]
        };
    }
    
    // =================
    // 全局大事件管理方法
    // =================
    
    // 获取所有全局大事件
    getAllGlobalEvents() {
        return this.storage.get(this.storage.keys.globalEvents) || {};
    }
    
    // 获取事件关联映射
    getEventAssociations() {
        return this.storage.get(this.storage.keys.eventAssociations) || {};
    }
    
    // 创建全局大事件
    createGlobalEvent(text, link = '') {
        const events = this.getAllGlobalEvents();
        const eventId = StringUtils.generateId();
        
        const event = {
            id: eventId,
            text: text,
            link: link,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        events[eventId] = event;
        this.storage.set(this.storage.keys.globalEvents, events);
        
        return event;
    }
    
    // 更新全局大事件
    updateGlobalEvent(eventId, text, link = '') {
        const events = this.getAllGlobalEvents();
        if (events[eventId]) {
            events[eventId].text = text;
            events[eventId].link = link;
            events[eventId].updatedAt = new Date().toISOString();
            this.storage.set(this.storage.keys.globalEvents, events);
            return events[eventId];
        }
        return null;
    }
    
    // 删除全局大事件（仅当没有关联时）
    deleteGlobalEvent(eventId) {
        const associatedDates = this.getEventAssociatedDates(eventId);
        if (associatedDates.length === 0) {
            const events = this.getAllGlobalEvents();
            delete events[eventId];
            this.storage.set(this.storage.keys.globalEvents, events);
            return true;
        }
        return false;
    }
    
    // 关联事件到日期
    associateEventToDate(eventId, date) {
        const associations = this.getEventAssociations();
        if (!associations[date]) {
            associations[date] = [];
        }
        
        if (!associations[date].includes(eventId)) {
            associations[date].push(eventId);
            this.storage.set(this.storage.keys.eventAssociations, associations);
            return true;
        }
        return false;
    }
    
    // 取消事件与日期的关联
    dissociateEventFromDate(eventId, date) {
        const associations = this.getEventAssociations();
        if (associations[date]) {
            associations[date] = associations[date].filter(id => id !== eventId);
            if (associations[date].length === 0) {
                delete associations[date];
            }
            this.storage.set(this.storage.keys.eventAssociations, associations);
            return true;
        }
        return false;
    }
    
    // 获取指定日期关联的所有事件
    getDateAssociatedEvents(date) {
        const associations = this.getEventAssociations();
        const events = this.getAllGlobalEvents();
        const eventIds = associations[date] || [];
        
        return eventIds.map(id => events[id]).filter(event => event);
    }
    
    // 获取指定事件关联的所有日期
    getEventAssociatedDates(eventId) {
        const associations = this.getEventAssociations();
        const dates = [];
        
        Object.entries(associations).forEach(([date, eventIds]) => {
            if (eventIds.includes(eventId)) {
                dates.push(date);
            }
        });
        
        return dates.sort();
    }
    
    // 获取指定日期可继承的事件（昨日未关联的事件）
    getInheritableEvents(date) {
        const yesterday = DateUtils.addDays(date, -1);
        const yesterdayEvents = this.getDateAssociatedEvents(yesterday);
        const todayEventIds = this.getEventAssociations()[date] || [];
        
        // 返回昨日的事件中未与今日关联的事件
        return yesterdayEvents.filter(event => !todayEventIds.includes(event.id));
    }
}

// 计划数据管理器
class PlanManager {
    constructor(storage) {
        this.storage = storage;
    }
    
    // 获取所有计划
    getPlans() {
        return this.storage.get(this.storage.keys.plans) || [];
    }
    
    // 获取指定ID的计划
    getPlan(id) {
        const plans = this.getPlans();
        return plans.find(plan => plan.id === id);
    }
    
    // 保存计划
    savePlan(plan) {
        const plans = this.getPlans();
        const existingIndex = plans.findIndex(p => p.id === plan.id);
        
        if (existingIndex >= 0) {
            plans[existingIndex] = { ...plan, updatedAt: new Date().toISOString() };
        } else {
            plan.id = StringUtils.generateId();
            plan.createdAt = new Date().toISOString();
            plan.updatedAt = new Date().toISOString();
            plans.push(plan);
        }
        
        return this.storage.set(this.storage.keys.plans, plans);
    }
    
    // 删除计划
    deletePlan(id) {
        const plans = this.getPlans();
        const filteredPlans = plans.filter(plan => plan.id !== id);
        return this.storage.set(this.storage.keys.plans, filteredPlans);
    }
    
    // 创建空计划
    createEmptyPlan() {
        return {
            id: '',
            name: '',
            tasks: [],
            status: 'active', // active, archived
            dailyExecutions: {}, // 每日执行记录: { 'YYYY-MM-DD': { status, startTime, endTime, totalTime, tasks } }
            createdAt: '',
            updatedAt: ''
        };
    }
    
    // 创建空任务
    createEmptyTask() {
        return {
            id: StringUtils.generateId(),
            text: '',
            required: false,
            completed: false,
            completedAt: null
        };
    }
    
    // 开始执行计划
    startPlan(id, date = DateUtils.getToday()) {
        const plan = this.getPlan(id);
        if (plan) {
            if (!plan.dailyExecutions) {
                plan.dailyExecutions = {};
            }
            
            plan.dailyExecutions[date] = {
                status: 'active',
                startTime: Date.now(),
                endTime: null,
                totalTime: 0,
                tasks: plan.tasks.map(task => ({
                    ...task,
                    completed: false,
                    completedAt: null
                }))
            };
            
            this.savePlan(plan);
        }
        return plan;
    }
    
    // 完成计划执行
    completePlan(id, date = DateUtils.getToday()) {
        const plan = this.getPlan(id);
        if (plan && plan.dailyExecutions && plan.dailyExecutions[date]) {
            const execution = plan.dailyExecutions[date];
            execution.status = 'completed';
            execution.endTime = Date.now();
            execution.totalTime = execution.endTime - execution.startTime;
            this.savePlan(plan);
        }
        return plan;
    }
    
    // 停止计划执行
    stopPlan(id, date = DateUtils.getToday()) {
        const plan = this.getPlan(id);
        if (plan && plan.dailyExecutions && plan.dailyExecutions[date]) {
            const execution = plan.dailyExecutions[date];
            execution.status = 'stopped';
            execution.endTime = Date.now();
            execution.totalTime = (execution.totalTime || 0) + (execution.endTime - execution.startTime);
            this.savePlan(plan);
        }
        return plan;
    }
    
    // 完成任务
    completeTask(planId, taskId, date = DateUtils.getToday()) {
        const plan = this.getPlan(planId);
        if (plan && plan.dailyExecutions && plan.dailyExecutions[date]) {
            const execution = plan.dailyExecutions[date];
            const task = execution.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = true;
                task.completedAt = Date.now();
                this.savePlan(plan);
                
                // 检查是否所有任务都完成了
                const allCompleted = execution.tasks.every(t => t.completed);
                if (allCompleted) {
                    this.completePlan(planId, date);
                }
            }
        }
        return plan;
    }
    
    // 获取计划在指定日期的执行情况
    getPlanExecution(planId, date = DateUtils.getToday()) {
        const plan = this.getPlan(planId);
        if (plan && plan.dailyExecutions && plan.dailyExecutions[date]) {
            return plan.dailyExecutions[date];
        }
        return null;
    }
    
    // 获取计划的所有执行记录
    getPlanExecutionHistory(planId) {
        const plan = this.getPlan(planId);
        if (plan && plan.dailyExecutions) {
            return Object.entries(plan.dailyExecutions)
                .map(([date, execution]) => ({ date, ...execution }))
                .sort((a, b) => b.date.localeCompare(a.date));
        }
        return [];
    }
    
    // 获取常用工作项
    getCommonTasks() {
        return this.storage.get(this.storage.keys.commonTasks) || [];
    }
    
    // 保存常用工作项
    saveCommonTasks(tasks) {
        return this.storage.set(this.storage.keys.commonTasks, tasks);
    }
    
    // 添加常用工作项
    addCommonTask(text) {
        const tasks = this.getCommonTasks();
        const task = {
            id: StringUtils.generateId(),
            text: text,
            createdAt: new Date().toISOString()
        };
        tasks.push(task);
        this.saveCommonTasks(tasks);
        return task;
    }
    
    // 删除常用工作项
    removeCommonTask(id) {
        const tasks = this.getCommonTasks();
        const filteredTasks = tasks.filter(task => task.id !== id);
        return this.saveCommonTasks(filteredTasks);
    }
    
    // 获取计划进度
    getPlanProgress(plan, date = DateUtils.getToday()) {
        const execution = this.getPlanExecution(plan.id, date);
        if (execution) {
            const totalTasks = execution.tasks.length;
            const completedTasks = execution.tasks.filter(task => task.completed).length;
            
            return {
                total: totalTasks,
                completed: completedTasks,
                percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            };
        } else {
            const totalTasks = plan.tasks.length;
            return {
                total: totalTasks,
                completed: 0,
                percentage: 0
            };
        }
    }
    
    // 获取未完成的必需任务
    getIncompleteRequiredTasks(plan, date = DateUtils.getToday()) {
        const execution = this.getPlanExecution(plan.id, date);
        if (execution) {
            return execution.tasks.filter(task => task.required && !task.completed);
        }
        return plan.tasks.filter(task => task.required);
    }
    
    // 获取计划统计信息
    getStatistics() {
        const plans = this.getPlans();
        
        const stats = {
            total: plans.length,
            draft: 0,
            active: 0,
            completed: 0,
            stopped: 0,
            totalTime: 0,
            averageTime: 0
        };
        
        plans.forEach(plan => {
            stats[plan.status]++;
            if (plan.totalTime) {
                stats.totalTime += plan.totalTime;
            }
        });
        
        const completedPlans = stats.completed + stats.stopped;
        if (completedPlans > 0) {
            stats.averageTime = stats.totalTime / completedPlans;
        }
        
        return stats;
    }
}

// 创建全局存储实例
const storage = new StorageManager();
const diaryManager = new DiaryManager(storage);
const planManager = new PlanManager(storage);

// 将管理器设置为全局变量
window.storage = storage;
window.diaryManager = diaryManager;
window.planManager = planManager;