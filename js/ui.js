// ui.js - UI 渲染逻辑

let apiRequestCache = {};
const API = {
    async fetch(url, options) {
        const key = url + JSON.stringify(options);
        if (apiRequestCache[key]) {
            return apiRequestCache[key];
        }
        const promise = fetch(url, options).then(r => r.json());
        apiRequestCache[key] = promise;
        return promise;
    }
};

let isLoadingVehicles = false;

const UI = {
    currentView: 'auth',
    isLoggedIn: false,
    currentUser: null,
    isLoading: false,

    init() {
        const token = localStorage.getItem('token');
        if (token) {
            this.isLoggedIn = true;
        }
        this.bindEvents();
        this.checkAuth();
    },

    checkAuth() {
        if (this.isLoggedIn) {
            this.showView('home');
            this.loadInitialData();
        } else {
            this.showView('auth');
        }
    },

    async loadInitialData() {
        try {
            await this.renderVehicleSelect();
            await this.renderHome();
        } catch (err) {
            console.error('加载数据失败:', err);
            this.logout();
        }
    },

    showView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const viewEl = document.getElementById(view + '-view');
        if (viewEl) viewEl.classList.remove('hidden');
        this.currentView = view;
    },

    // 显示加载状态
    showLoading(message = '加载中...') {
        this.isLoading = true;
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = '<div class=loader-overlay><div class=loader-spinner></div><div class=loader-message>' + message + '</div></div>';
            document.body.appendChild(loader);
        }
        loader.querySelector('.loader-message').textContent = message;
        loader.style.display = 'flex';
    },

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('global-loader');
        if (loader) loader.style.display = 'none';
    },

    // 显示错误/成功提示
    showTip(message, type = 'error') {
        const tip = document.createElement('div');
        tip.className = 'tip-message tip-' + type;
        tip.textContent = message;
        document.body.appendChild(tip);
        setTimeout(() => tip.classList.add('show'), 10);
        setTimeout(() => {
            tip.classList.remove('show');
            setTimeout(() => tip.remove(), 300);
        }, 3000);
    },

    // 禁用/启用按钮
    setButtonLoading(btn, loading, originalText) {
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.textContent;
            btn.textContent = '请稍候...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || originalText || '提交';
        }
    },

    bindEvents() {
        // 登录/注册 Tab 切换
        document.querySelectorAll('.auth-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const submitBtn = document.getElementById('auth-submit');
                if (submitBtn) {
                    submitBtn.textContent = btn.dataset.tab === 'login' ? '登录' : '注册';
                }
            });
        });

        // 登录/注册表单提交
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAuth();
            });
        }

        // Tab 切换
        document.querySelectorAll('.tab-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // 记录类型 Tab
        document.querySelectorAll('.record-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.record-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderRecords(tab.dataset.type);
            });
        });

        // 统计周期选择
        const statsPeriod = document.getElementById('stats-period');
        if (statsPeriod) {
            statsPeriod.addEventListener('change', (e) => {
                this.renderStats(e.target.value);
            });
        }

        // 车辆选择
        const vehicleSelect = document.getElementById('vehicle-select');
        if (vehicleSelect) {
            vehicleSelect.addEventListener('change', (e) => {
                localStorage.setItem('currentVehicleId', e.target.value);
                this.refreshAll();
            });
        }

        // 添加记录表单
        const recordForm = document.getElementById('record-form');
        if (recordForm) {
            recordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveRecord();
            });
        }

        // 添加车辆表单
        const vehicleForm = document.getElementById('vehicle-form');
        if (vehicleForm) {
            vehicleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveVehicle();
            });
        }
    },

    async handleAuth() {
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const isLogin = document.querySelector('.auth-tab.active')?.dataset.tab === 'login';
        const tip = document.getElementById('auth-tip');
        const submitBtn = document.getElementById('auth-submit');
        
        if (!username || !password) {
            if (tip) tip.textContent = '请输入用户名和密码';
            return;
        }

        // 密码强度校验（注册时）
        if (!isLogin && password.length < 6) {
            if (tip) tip.textContent = '密码长度至少6位';
            return;
        }
        
        // 禁用按钮，防止重复提交
        if (submitBtn) this.setButtonLoading(submitBtn, true, isLogin ? '登录' : '注册');
        if (tip) tip.textContent = '请稍候...';
        
        try {
            if (isLogin) {
                const data = await UserAPI.login(username, password);
                Token.set(data.token);
                localStorage.setItem('username', data.user.username);
                this.currentUser = data.user;
                this.isLoggedIn = true;
                this.showTip('登录成功', 'success');
            } else {
                await UserAPI.register(username, password);
                this.showTip('注册成功，请登录', 'success');
                document.querySelector('.auth-tab[data-tab=login]')?.click();
                if (submitBtn) this.setButtonLoading(submitBtn, false, '注册');
                return;
            }
            
            this.showView('home');
            await this.loadInitialData();
        } catch (err) {
            if (tip) tip.textContent = err.message || '操作失败，请重试';
            this.showTip(err.message || '操作失败', 'error');
        } finally {
            if (submitBtn) this.setButtonLoading(submitBtn, false, isLogin ? '登录' : '注册');
        }
    },

    logout() {
        Token.remove();
        localStorage.removeItem('username');
        localStorage.removeItem('currentVehicleId');
        this.isLoggedIn = false;
        this.currentUser = null;
        
        const usernameEl = document.getElementById('auth-username');
        const passwordEl = document.getElementById('auth-password');
        const tipEl = document.getElementById('auth-tip');
        if (usernameEl) usernameEl.value = '';
        if (passwordEl) passwordEl.value = '';
        if (tipEl) tipEl.textContent = '';
        
        this.showView('auth');
    },

    switchView(view) {
        if (!this.isLoggedIn) {
            this.showView('auth');
            return;
        }

        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const viewEl = document.getElementById(view + '-view');
        if (viewEl) viewEl.classList.remove('hidden');
        
        document.querySelectorAll('.tab-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.currentView = view;

        if (view === 'home') this.renderHome();
        if (view === 'record') this.renderRecords('all');
        if (view === 'stats') this.renderStats('month');
        if (view === 'vehicle') this.renderVehicles();
    },

    refreshAll() {
        if (this.currentView === 'home') this.renderHome();
        if (this.currentView === 'stats') this.renderStats(document.getElementById('stats-period')?.value || 'month');
    },

    async renderVehicleSelect() {
        if (isLoadingVehicles) return;
        
        // 添加防抖
        const debounceKey = 'renderVehicleSelect_debounce';
        if (this[debounceKey]) clearTimeout(this[debounceKey]);
        this[debounceKey] = setTimeout(() => {
            isLoadingVehicles = true;
            setTimeout(() => isLoadingVehicles = false, 500);
            this._doRenderVehicleSelect();
        }, 300);
    },

    async _doRenderVehicleSelect() {
        try {
            const vehicles = await VehicleAPI.getList();
            const currentId = localStorage.getItem('currentVehicleId');
            let html = '<select id=vehicle-select>';
            vehicles.forEach(v => {
                const selected = (currentId && currentId == v.id) || (!currentId && vehicles.length === 1) ? 'selected' : '';
                html += '<option value=' + v.id + ' ' + selected + '>' + v.name + '</option>';
            });
            html += '</select>';
            const container = document.getElementById('vehicle-select-container');
            if (container) container.innerHTML = html;
            
            // 注意：事件已在 bindEvents 中绑定，此处不再重复绑定
            
            if (vehicles.length === 0) {
                this.showView('vehicle');
                this.showTip('请先添加车辆', 'error');
            }
        } catch (err) {
            console.error('获取车辆列表失败:', err);
        }
    },

    async renderHome() {
        const vehicleId = localStorage.getItem('currentVehicleId');
        if (!vehicleId) return;

        this.showLoading('加载中...');
        try {
            const [stats, recentRecords] = await Promise.all([
                StatsAPI.get(vehicleId, 'month'),
                RecordAPI.getList(vehicleId, 'all')
            ]);

            const totalAmount = stats.totalAmount || 0;
            const totalCount = stats.totalCount || 0;
            
            const totalEl = document.getElementById('month-total-amount');
            if (totalEl) totalEl.textContent = '¥' + totalAmount.toFixed(2);

            const countEl = document.getElementById('month-record-count');
            if (countEl) countEl.textContent = totalCount + '条';

            const listEl = document.getElementById('recent-records-list');
            if (listEl) {
                const recent = recentRecords.slice(0, 5);
                if (recent.length === 0) {
                    listEl.innerHTML = '<div class=empty-tip>暂无记录，点击下方按钮添加</div>';
                } else {
                    listEl.innerHTML = recent.map(r => this.renderRecordItem(r)).join('');
                    this.bindRecordEvents(listEl);
                }
            }
        } catch (err) {
            console.error('加载首页数据失败:', err);
            this.showTip('加载数据失败', 'error');
        } finally {
            this.hideLoading();
        }
    },

    renderRecordItem(record) {
        const typeIcons = { 'energy': '⚡', 'maintenance': '🔧', 'insurance': '🛡️', 'daily': '📝', 'violation': '🚫' };
        const typeNames = { 'energy': '能源', 'maintenance': '保养', 'insurance': '保险', 'daily': '日常', 'violation': '违章' };
        const icon = typeIcons[record.category] || '📝';
        const typeName = typeNames[record.category] || '记录';
        
        const amount = record.data?.amount || record.data?.price * record.data?.quantity || 0;
        const date = new Date(record.created_at).toLocaleDateString('zh-CN');
        
        return '<div class=record-item data-id= + record.id +  data-category= + record.category + >' +
            '<div class=record-icon>' + icon + '</div>' +
            '<div class=record-info>' +
                '<div class=record-title>' + (record.data?.type || typeName) + '</div>' +
                '<div class=record-date>' + date + '</div>' +
            '</div>' +
            '<div class=record-amount>¥' + amount.toFixed(2) + '</div>' +
            '<div class=record-actions>' +
                '<button class=btn-icon btn-delete data-id= + record.id +  data-category= + record.category + >🗑️</button>' +
            '</div>' +
        '</div>';
    },

    bindRecordEvents(container) {
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const category = btn.dataset.category;
                
                if (!confirm('确定要删除这条记录吗？')) return;
                
                this.showLoading('删除中...');
                try {
                    await RecordAPI.delete(id, category);
                    this.showTip('删除成功', 'success');
                    this.refreshAll();
                } catch (err) {
                    this.showTip(err.message || '删除失败', 'error');
                } finally {
                    this.hideLoading();
                }
            });
        });
    },

    async renderRecords(type) {
        const vehicleId = localStorage.getItem('currentVehicleId');
        if (!vehicleId) return;

        this.showLoading('加载记录...');
        try {
            const records = await RecordAPI.getList(vehicleId, type);
            const listEl = document.getElementById('records-list');
            
            if (listEl) {
                if (records.length === 0) {
                    listEl.innerHTML = '<div class=empty-tip>暂无记录</div>';
                } else {
                    listEl.innerHTML = records.map(r => this.renderRecordItem(r)).join('');
                    this.bindRecordEvents(listEl);
                }
            }
        } catch (err) {
            console.error('获取记录失败:', err);
            this.showTip('加载失败', 'error');
        } finally {
            this.hideLoading();
        }
    },

    async renderStats(period) {
        const vehicleId = localStorage.getItem('currentVehicleId');
        if (!vehicleId) return;

        this.showLoading('加载统计...');
        try {
            const stats = await StatsAPI.get(vehicleId, period);
            
            const totalEl = document.getElementById('stats-total-amount');
            if (totalEl) totalEl.textContent = '¥' + (stats.totalAmount || 0).toFixed(2);

            const countEl = document.getElementById('stats-record-count');
            if (countEl) countEl.textContent = (stats.totalCount || 0) + '条';

            const categoryEl = document.getElementById('stats-category');
            if (categoryEl && stats.byCategory) {
                const categories = Object.entries(stats.byCategory);
                if (categories.length === 0) {
                    categoryEl.innerHTML = '<div class=empty-tip>暂无数据</div>';
                } else {
                    const typeNames = { 'energy': '⚡ 能源', 'maintenance': '🔧 保养', 'insurance': '🛡️ 保险', 'daily': '📝 日常', 'violation': '🚫 违章' };
                    categoryEl.innerHTML = categories.map(([cat, data]) => {
                        return '<div class=category-item>' +
                            '<span class=category-name>' + (typeNames[cat] || cat) + '</span>' +
                            '<span class=category-amount>¥' + (data.amount || 0).toFixed(2) + '</span>' +
                        '</div>';
                    }).join('');
                }
            }

            this.renderChart(stats);
        } catch (err) {
            console.error('获取统计失败:', err);
            this.showTip('加载失败', 'error');
        } finally {
            this.hideLoading();
        }
    },

    renderChart(stats) {
        const canvas = document.getElementById('stats-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (window.statsChartInstance) {
            window.statsChartInstance.destroy();
        }

        if (!stats.byCategory || Object.keys(stats.byCategory).length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = [];
        const data = [];
        const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
        
        Object.entries(stats.byCategory).forEach(([cat, catData], i) => {
            const typeNames = { 'energy': '能源', 'maintenance': '保养', 'insurance': '保险', 'daily': '日常', 'violation': '违章' };
            labels.push(typeNames[cat] || cat);
            data.push(catData.amount || 0);
        });

        window.statsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    async renderVehicles() {
        if (isLoadingVehicles) return;
        isLoadingVehicles = true;
        setTimeout(() => isLoadingVehicles = false, 500);
        this.showLoading('加载车辆...');
        try {
            const vehicles = await VehicleAPI.getList();
            const listEl = document.getElementById('vehicles-list');
            
            if (listEl) {
                if (vehicles.length === 0) {
                    listEl.innerHTML = '<div class=empty-tip>暂无车辆，点击下方添加</div>';
                } else {
                    listEl.innerHTML = vehicles.map(v => {
                        return '<div class=vehicle-item>' +
                            '<div class=vehicle-info>' +
                                '<div class=vehicle-name>' + v.name + '</div>' +
                                '<div class=vehicle-meta>' + (v.purchase_date ? '购于 ' + v.purchase_date : '') + ' | ' + (v.purchase_price ? '¥' + v.purchase_price : '') + '</div>' +
                            '</div>' +
                            '<div class=vehicle-actions>' +
                                '<button class=btn-icon btn-edit data-id= + v.id +  data-name= + (v.name || ) +  data-date= + (v.purchase_date || ) +  data-price= + (v.purchase_price || ) +  data-mileage= + (v.initial_mileage || ) + >✏️</button>' +
                                '<button class=btn-icon btn-delete-vehicle data-id= + v.id + >🗑️</button>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                    
                    listEl.querySelectorAll('.btn-delete-vehicle').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.dataset.id;
                            if (!confirm('确定要删除该车辆吗？删除后所有相关记录也将被删除！')) return;
                            
                            this.showLoading('删除中...');
                            try {
                                await VehicleAPI.delete(id);
                                this.showTip('删除成功', 'success');
                                await this.renderVehicles();
                                await this.renderVehicleSelect();
                                this.refreshAll();
                            } catch (err) {
                                this.showTip(err.message || '删除失败', 'error');
                            } finally {
                                this.hideLoading();
                            }
                        });
                    });
                    
                    listEl.querySelectorAll('.btn-edit').forEach(btn => {
                        btn.addEventListener('click', () => {
                            document.getElementById('vehicle-name').value = btn.dataset.name || '';
                            document.getElementById('vehicle-date').value = btn.dataset.date || '';
                            document.getElementById('vehicle-price').value = btn.dataset.price || '';
                            document.getElementById('vehicle-mileage').value = btn.dataset.mileage || '';
                            document.getElementById('vehicle-id').value = btn.dataset.id;
                            document.getElementById('vehicle-form-title').textContent = '编辑车辆';
                        });
                    });
                }
            }
        } catch (err) {
            console.error('获取车辆列表失败:', err);
            this.showTip('加载失败', 'error');
        } finally {
            this.hideLoading();
        }
    },

    // 显示添加车辆弹窗
    showAddVehicle() {
        const modal = document.getElementById('vehicle-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const title = document.getElementById('vehicle-form-title');
            if (title) title.textContent = '添加车辆';
            // 清空表单
            document.getElementById('vehicle-name').value = '';
            document.getElementById('vehicle-date').value = '';
            document.getElementById('vehicle-price').value = '';
            document.getElementById('vehicle-mileage').value = '';
            document.getElementById('vehicle-id').value = '';
        }
    },

    // 关闭车辆弹窗
    closeVehicleModal() {
        const modal = document.getElementById('vehicle-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    async saveVehicle() {
        const name = document.getElementById('vehicle-name').value.trim();
        const date = document.getElementById('vehicle-date').value;
        const price = parseFloat(document.getElementById('vehicle-price').value) || 0;
        const mileage = parseInt(document.getElementById('vehicle-mileage').value) || 0;
        const id = document.getElementById('vehicle-id').value;
        
        if (!name) {
            this.showTip('请输入车辆名称', 'error');
            return;
        }

        const submitBtn = document.querySelector('#vehicle-form button[type=submit]');
        this.setButtonLoading(submitBtn, true, '保存');

        try {
            if (id) {
                await VehicleAPI.update(id, { name, purchaseDate: date, purchasePrice: price, initialMileage: mileage });
                this.showTip('更新成功', 'success');
            } else {
                await VehicleAPI.add({ name, purchaseDate: date, purchasePrice: price, initialMileage: mileage });
                this.showTip('添加成功', 'success');
            }
            
            document.getElementById('vehicle-name').value = '';
            document.getElementById('vehicle-date').value = '';
            document.getElementById('vehicle-price').value = '';
            document.getElementById('vehicle-mileage').value = '';
            document.getElementById('vehicle-id').value = '';
            document.getElementById('vehicle-form-title').textContent = '添加车辆';
            
            await this.renderVehicles();
            await this.renderVehicleSelect();
            this.refreshAll();
        } catch (err) {
            this.showTip(err.message || '操作失败', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false, '保存');
        }
    },

    async saveRecord() {
        const vehicleId = localStorage.getItem('currentVehicleId');
        if (!vehicleId) {
            this.showTip('请先选择车辆', 'error');
            return;
        }

        const category = document.querySelector('.record-tabs .tab.active')?.dataset.type || 'energy';
        const type = document.getElementById('record-type')?.value || '充电';
        const amount = parseFloat(document.getElementById('record-amount')?.value);
        const date = document.getElementById('record-date')?.value || new Date().toISOString().split('T')[0];
        
        if (isNaN(amount) || amount <= 0) {
            this.showTip('请输入有效的金额（大于0）', 'error');
            return;
        }

        let data = { type, amount, date };

        if (category === 'energy') {
            data.quantity = parseFloat(document.getElementById('record-quantity')?.value) || 0;
            data.pricePerUnit = parseFloat(document.getElementById('record-price')?.value) || 0;
            data.location = document.getElementById('record-location')?.value || '';
            data.mileage = parseInt(document.getElementById('record-mileage')?.value) || 0;
        } else if (category === 'maintenance') {
            data.description = document.getElementById('record-desc')?.value || '';
            data.mileage = parseInt(document.getElementById('record-mileage')?.value) || 0;
        } else if (category === 'daily') {
            data.location = document.getElementById('record-location')?.value || '';
        } else if (category === 'violation') {
            data.points = parseInt(document.getElementById('record-points')?.value) || 0;
            data.reason = document.getElementById('record-reason')?.value || '';
            data.status = document.getElementById('record-status')?.value || '未处理';
        } else if (category === 'insurance') {
            data.insuranceType = document.getElementById('record-insurance-type')?.value || '商业险';
            data.startDate = document.getElementById('record-start-date')?.value || date;
            data.endDate = document.getElementById('record-end-date')?.value || date;
        }

        const submitBtn = document.querySelector('#record-form button[type=submit]');
        this.setButtonLoading(submitBtn, true, '保存');

        try {
            await RecordAPI.add(vehicleId, category, data);
            this.showTip('添加成功', 'success');
            
            document.getElementById('record-amount').value = '';
            document.getElementById('record-quantity').value = '';
            document.getElementById('record-price').value = '';
            document.getElementById('record-location').value = '';
            document.getElementById('record-mileage').value = '';
            document.getElementById('record-desc').value = '';
            
            this.refreshAll();
        } catch (err) {
            this.showTip(err.message || '添加失败', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false, '保存');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    
    // 暴露全局函数供 HTML onclick 调用
    window.showAddVehicle = () => UI.showAddVehicle();
    window.closeVehicleModal = () => UI.closeVehicleModal();
});
