// ui.js - UI 渲染逻辑

const UI = {
    // 当前视图
    currentView: 'home',

    // 初始化
    init() {
        this.bindEvents();
        this.renderVehicleSelect();
        this.renderHome();
    },

    // 绑定事件
    bindEvents() {
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
        document.getElementById('stats-period').addEventListener('change', (e) => {
            this.renderStats(e.target.value);
        });

        // 车辆选择
        document.getElementById('vehicle-select').addEventListener('change', (e) => {
            Storage.setCurrentVehicleId(e.target.value);
            this.refreshAll();
        });

        // 添加记录表单
        document.getElementById('record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });

        // 添加车辆表单
        document.getElementById('vehicle-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVehicle();
        });

        // 记录类型切换
        document.getElementById('record-type').addEventListener('change', (e) => {
            const quantityGroup = document.getElementById('quantity-group');
            if (e.target.value === 'charge') {
                quantityGroup.querySelector('label').textContent = '充电度数 (kWh)';
            } else {
                quantityGroup.querySelector('label').textContent = '加油升数 (L)';
            }
        });
    },

    // 切换视图
    switchView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`${view}-view`).classList.remove('hidden');
        
        document.querySelectorAll('.tab-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.currentView = view;

        // 刷新对应视图
        if (view === 'home') this.renderHome();
        if (view === 'record') this.renderRecords('all');
        if (view === 'stats') this.renderStats('month');
        if (view === 'vehicle') this.renderVehicles();
    },

    // 刷新所有视图
    refreshAll() {
        if (this.currentView === 'home') this.renderHome();
        if (this.currentView === 'stats') this.renderStats(document.getElementById('stats-period').value);
    },

    // 渲染车辆选择器
    renderVehicleSelect() {
        const vehicles = Storage.getVehicles();
        const currentId = Storage.getCurrentVehicleId();
        const select = document.getElementById('vehicle-select');
        
        select.innerHTML = vehicles.map(v => 
            `<option value="${v.id}" ${v.id === currentId ? 'selected' : ''}>${v.name}</option>`
        ).join('');

        // 如果没有车辆，提示添加
        if (vehicles.length === 0) {
            this.showEmptyVehiclePrompt();
        }
    },

    // 显示添加车辆提示
    showEmptyVehiclePrompt() {
        alert('请先添加车辆');
        this.switchView('vehicle');
    },

    // 渲染首页
    renderHome() {
        const vehicleId = Storage.getCurrentVehicleId();
        if (!vehicleId) return;

        // 渲染统计
        document.getElementById('monthly-cost').textContent = `¥${DataModel.getMonthlyCost(vehicleId).toFixed(2)}`;
        document.getElementById('yearly-cost').textContent = `¥${DataModel.getYearlyCost(vehicleId).toFixed(2)}`;
        document.getElementById('total-cost').textContent = `¥${DataModel.getTotalCost(vehicleId).toFixed(2)}`;

        // 渲染最近记录
        const recent = DataModel.getRecentRecords(vehicleId, 5);
        const list = document.getElementById('recent-list');
        
        if (recent.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>暂无记录</p></div>';
        } else {
            list.innerHTML = recent.map(r => this.renderRecordItem(r)).join('');
        }
    },

    // 渲染记录列表
    renderRecords(type) {
        const vehicleId = Storage.getCurrentVehicleId();
        if (!vehicleId) return;

        let records = DataModel.getAllRecords(vehicleId);
        
        if (type !== 'all') {
            records = records.filter(r => r.category === type);
        }

        const list = document.getElementById('record-list');
        
        if (records.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>暂无记录</p></div>';
        } else {
            list.innerHTML = records.map(r => this.renderRecordItem(r)).join('');
        }
    },

    // 渲染单条记录
    renderRecordItem(record) {
        const icons = {
            energy: '⚡',
            maintenance: '🔧',
            insurance: '🛡️',
            daily: '📝',
            violation: '🚫'
        };

        const labels = {
            energy: record.type === 'charge' ? '充电' : '加油',
            maintenance: '保养',
            insurance: '保险',
            daily: '日常',
            violation: '违章'
        };

        return `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-icon ${record.category}">${icons[record.category]}</div>
                    <div class="record-detail">
                        <h4>${labels[record.category]}</h4>
                        <p>${record.date} ${record.location || ''}</p>
                    </div>
                </div>
                <div class="record-amount expense">-¥${parseFloat(record.amount).toFixed(2)}</div>
            </div>
        `;
    },

    // 渲染统计页
    renderStats(period) {
        const vehicleId = Storage.getCurrentVehicleId();
        if (!vehicleId) return;

        const stats = DataModel.calculateStats(vehicleId, period);
        
        // 渲染详细统计
        const detailList = document.getElementById('stats-detail-list');
        const categories = [
            { key: 'energy', label: '能源', icon: '⚡' },
            { key: 'maintenance', label: '保养', icon: '🔧' },
            { key: 'insurance', label: '保险', icon: '🛡️' },
            { key: 'daily', label: '日常', icon: '📝' },
            { key: 'violation', label: '违章', icon: '🚫' }
        ];

        detailList.innerHTML = categories.map(cat => `
            <div class="detail-item">
                <div class="detail-label">
                    <span>${cat.icon}</span>
                    <span>${cat.label}</span>
                </div>
                <div class="detail-value">¥${stats[cat.key].toFixed(2)}</div>
            </div>
        `).join('') + `
            <div class="detail-item">
                <div class="detail-label">
                    <span>💰</span>
                    <span>合计</span>
                </div>
                <div class="detail-value" style="color: var(--primary)">¥${stats.total.toFixed(2)}</div>
            </div>
        `;

        // 渲染图表
        this.renderCharts(stats, vehicleId, period);
    },

    // 渲染图表
    renderCharts(stats, vehicleId, period) {
        // 饼图
        const pieCtx = document.getElementById('pie-chart');
        if (window.pieChart) window.pieChart.destroy();
        
        window.pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['能源', '保养', '保险', '日常', '违章'],
                datasets: [{
                    data: [stats.energy, stats.maintenance, stats.insurance, stats.daily, stats.violation],
                    backgroundColor: ['#007AFF', '#FF9500', '#34C759', '#AF52DE', '#FF3B30']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // 折线图
        const lineCtx = document.getElementById('line-chart');
        if (window.lineChart) window.lineChart.destroy();

        const trend = DataModel.getMonthlyTrend(vehicleId, 6);
        
        window.lineChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: trend.map(t => t.month.slice(5)),
                datasets: [{
                    label: '花费',
                    data: trend.map(t => t.total),
                    borderColor: '#007AFF',
                    fill: false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    // 渲染车辆列表
    renderVehicles() {
        const vehicles = Storage.getVehicles();
        const list = document.getElementById('vehicle-list');
        
        if (vehicles.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>暂无车辆，点击添加</p></div>';
        } else {
            list.innerHTML = vehicles.map(v => `
                <div class="vehicle-item">
                    <h4>${v.name}</h4>
                    <p>购车日期: ${v.purchaseDate || '未设置'} | 价格: ¥${v.purchasePrice || 0}</p>
                    <div class="vehicle-actions">
                        <button class="btn-small danger" onclick="deleteVehicle('${v.id}')">删除</button>
                    </div>
                </div>
            `).join('');
        }
    },

    // 显示添加记录弹窗
    showAddModal(type) {
        const vehicleId = Storage.getCurrentVehicleId();
        if (!vehicleId) {
            alert('请先添加车辆');
            return;
        }

        const modal = document.getElementById('add-modal');
        const title = document.getElementById('modal-title');
        
        // 获取各个表单元素
        const typeGroup = document.getElementById('type-select-group');
        const recordType = document.getElementById('record-type');
        const quantityGroup = document.getElementById('quantity-group');
        const mileageGroup = document.getElementById('mileage-group');
        const pointsGroup = document.getElementById('points-group');
        const statusGroup = document.getElementById('status-group');
        
        // 默认隐藏所有可选字段
        typeGroup.classList.add('hidden');
        quantityGroup.classList.add('hidden');
        mileageGroup.classList.add('hidden');
        pointsGroup.classList.add('hidden');
        statusGroup.classList.add('hidden');
        
        // 根据类型显示不同选项
        if (type === 'energy') {
            // 能源：显示类型（充电/加油）、数量、里程
            title.textContent = '能源记录';
            typeGroup.classList.remove('hidden');
            recordType.innerHTML = `
                <option value="charge">充电</option>
                <option value="fuel">加油</option>
            `;
            quantityGroup.classList.remove('hidden');
            quantityGroup.querySelector('label').textContent = '充电度数 (kWh) / 加油升数 (L)';
            mileageGroup.classList.remove('hidden');
            
        } else if (type === 'maintenance') {
            // 保养：显示保养类型
            title.textContent = '保养记录';
            typeGroup.classList.remove('hidden');
            recordType.innerHTML = `
                <option value="小保养">小保养</option>
                <option value="大保养">大保养</option>
                <option value="维修">维修</option>
                <option value="配件">配件更换</option>
            `;
            mileageGroup.classList.remove('hidden');
            
        } else if (type === 'insurance') {
            // 保险：显示保险类型
            title.textContent = '保险记录';
            typeGroup.classList.remove('hidden');
            recordType.innerHTML = `
                <option value="交强险">交强险</option>
                <option value="商业险">商业险</option>
            `;
            
        } else if (type === 'daily') {
            // 日常：显示日常类型
            title.textContent = '日常花费';
            typeGroup.classList.remove('hidden');
            recordType.innerHTML = `
                <option value="洗车">洗车</option>
                <option value="停车">停车</option>
                <option value="过路费">过路费</option>
                <option value="车载用品">车载用品</option>
                <option value="其他">其他</option>
            `;
            
        } else if (type === 'violation') {
            // 违章：显示违章类型、扣分、处理状态
            title.textContent = '违章记录';
            typeGroup.classList.remove('hidden');
            recordType.innerHTML = `
                <option value="违停">违停</option>
                <option value="闯红灯">闯红灯</option>
                <option value="超速">超速</option>
                <option value="其他">其他</option>
            `;
            pointsGroup.classList.remove('hidden');
            statusGroup.classList.remove('hidden');
        }

        // 设置日期为今天
        document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
        
        // 清除其他字段
        document.getElementById('record-amount').value = '';
        document.getElementById('record-quantity').value = '';
        document.getElementById('record-mileage').value = '';
        document.getElementById('record-location').value = '';
        document.getElementById('record-points').value = '0';

        // 保存当前类型
        modal.dataset.type = type;
        
        modal.classList.remove('hidden');
    },

    // 关闭弹窗
    closeModal() {
        document.getElementById('add-modal').classList.add('hidden');
    },

    // 保存记录
    saveRecord() {
        const modal = document.getElementById('add-modal');
        const type = modal.dataset.type;
        const vehicleId = Storage.getCurrentVehicleId();

        const data = {
            vehicleId,
            type: document.getElementById('record-type').value,
            amount: parseFloat(document.getElementById('record-amount').value),
            quantity: parseFloat(document.getElementById('record-quantity').value) || 0,
            date: document.getElementById('record-date').value,
            mileage: parseInt(document.getElementById('record-mileage').value) || 0,
            location: document.getElementById('record-location').value,
            points: parseInt(document.getElementById('record-points').value) || 0,
            status: document.getElementById('record-status')?.value || ''
        };

        if (type === 'energy') {
            DataModel.addEnergyRecord(data);
        } else if (type === 'maintenance') {
            DataModel.addMaintenanceRecord(data);
        } else if (type === 'daily') {
            DataModel.addDailyRecord(data);
        } else if (type === 'violation') {
            DataModel.addViolationRecord(data);
        }

        this.closeModal();
        this.refreshAll();
    },

    // 显示添加车辆弹窗
    showAddVehicle() {
        document.getElementById('vehicle-modal').classList.remove('hidden');
    },

    // 关闭车辆弹窗
    closeVehicleModal() {
        document.getElementById('vehicle-modal').classList.add('hidden');
    },

    // 保存车辆
    saveVehicle() {
        const vehicle = {
            name: document.getElementById('vehicle-name').value,
            purchaseDate: document.getElementById('vehicle-purchase-date').value,
            purchasePrice: parseFloat(document.getElementById('vehicle-price').value) || 0,
            initialMileage: parseInt(document.getElementById('vehicle-initial-mileage').value) || 0
        };

        DataModel.addVehicle(vehicle);
        this.closeVehicleModal();
        this.renderVehicleSelect();
        this.renderVehicles();
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI };
}
