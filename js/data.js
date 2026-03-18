// data.js - 数据模型和计算

const DataModel = {
    // 车辆操作
    addVehicle(vehicle) {
        const vehicles = Storage.getVehicles();
        vehicle.id = generateId();
        vehicle.createdAt = new Date().toISOString();
        vehicles.push(vehicle);
        Storage.saveVehicles(vehicles);
        
        // 如果是第一辆车，自动选中
        if (vehicles.length === 1) {
            Storage.setCurrentVehicleId(vehicle.id);
        }
        
        return vehicle;
    },

    updateVehicle(id, data) {
        const vehicles = Storage.getVehicles();
        const index = vehicles.findIndex(v => v.id === id);
        if (index !== -1) {
            vehicles[index] = { ...vehicles[index], ...data };
            Storage.saveVehicles(vehicles);
            return vehicles[index];
        }
        return null;
    },

    deleteVehicle(id) {
        const vehicles = Storage.getVehicles();
        const filtered = vehicles.filter(v => v.id !== id);
        Storage.saveVehicles(filtered);
        
        // 如果删除的是当前选中的车辆，重新选择
        if (Storage.getCurrentVehicleId() === id) {
            const remaining = Storage.getVehicles();
            Storage.setCurrentVehicleId(remaining.length > 0 ? remaining[0].id : null);
        }
    },

    // 能源记录操作
    addEnergyRecord(record) {
        const records = Storage.getEnergyRecords();
        record.id = generateId();
        record.createdAt = new Date().toISOString();
        records.push(record);
        Storage.saveEnergyRecords(records);
        return record;
    },

    deleteEnergyRecord(id) {
        const records = Storage.getEnergyRecords();
        Storage.saveEnergyRecords(records.filter(r => r.id !== id));
    },

    // 保养记录操作
    addMaintenanceRecord(record) {
        const records = Storage.getMaintenanceRecords();
        record.id = generateId();
        record.createdAt = new Date().toISOString();
        records.push(record);
        Storage.saveMaintenanceRecords(records);
        return record;
    },

    deleteMaintenanceRecord(id) {
        const records = Storage.getMaintenanceRecords();
        Storage.saveMaintenanceRecords(records.filter(r => r.id !== id));
    },

    // 保险记录操作
    addInsuranceRecord(record) {
        const records = Storage.getInsuranceRecords();
        record.id = generateId();
        record.createdAt = new Date().toISOString();
        records.push(record);
        Storage.saveInsuranceRecords(records);
        return record;
    },

    deleteInsuranceRecord(id) {
        const records = Storage.getInsuranceRecords();
        Storage.saveInsuranceRecords(records.filter(r => r.id !== id));
    },

    // 日常花费操作
    addDailyRecord(record) {
        const records = Storage.getDailyRecords();
        record.id = generateId();
        record.createdAt = new Date().toISOString();
        records.push(record);
        Storage.saveDailyRecords(records);
        return record;
    },

    deleteDailyRecord(id) {
        const records = Storage.getDailyRecords();
        Storage.saveDailyRecords(records.filter(r => r.id !== id));
    },

    // 违章记录操作
    addViolationRecord(record) {
        const records = Storage.getViolationRecords();
        record.id = generateId();
        record.createdAt = new Date().toISOString();
        records.push(record);
        Storage.saveViolationRecords(records);
        return record;
    },

    deleteViolationRecord(id) {
        const records = Storage.getViolationRecords();
        Storage.saveViolationRecords(records.filter(r => r.id !== id));
    },

    // 获取所有记录（按车辆筛选）
    getAllRecords(vehicleId) {
        const energy = Storage.getEnergyRecords().map(r => ({ ...r, category: 'energy' }));
        const maintenance = Storage.getMaintenanceRecords().map(r => ({ ...r, category: 'maintenance' }));
        const insurance = Storage.getInsuranceRecords().map(r => ({ ...r, category: 'insurance' }));
        const daily = Storage.getDailyRecords().map(r => ({ ...r, category: 'daily' }));
        const violation = Storage.getViolationRecords().map(r => ({ ...r, category: 'violation' }));

        let all = [...energy, ...maintenance, ...insurance, ...daily, ...violation];

        if (vehicleId) {
            all = all.filter(r => r.vehicleId === vehicleId);
        }

        // 按日期排序
        return all.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // 统计计算
    calculateStats(vehicleId, period = 'month') {
        const records = this.getAllRecords(vehicleId);
        
        // 获取时间范围
        const now = new Date();
        let startDate;
        
        if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else {
            startDate = new Date(0);
        }

        // 过滤记录
        const filtered = records.filter(r => new Date(r.date) >= startDate);

        // 分类汇总
        const stats = {
            energy: 0,
            maintenance: 0,
            insurance: 0,
            daily: 0,
            violation: 0,
            total: 0
        };

        filtered.forEach(r => {
            const amount = parseFloat(r.amount) || 0;
            if (stats[r.category] !== undefined) {
                stats[r.category] += amount;
                stats.total += amount;
            }
        });

        return stats;
    },

    // 计算百公里能耗
    calculateEnergyConsumption(vehicleId) {
        const records = Storage.getEnergyRecords()
            .filter(r => r.vehicleId === vehicleId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (records.length < 2) return null;

        let totalQuantity = 0;
        let totalDistance = 0;

        for (let i = 1; i < records.length; i++) {
            const current = records[i];
            const previous = records[i - 1];

            if (current.mileage && previous.mileage) {
                const distance = current.mileage - previous.mileage;
                if (distance > 0) {
                    totalDistance += distance;
                    totalQuantity += parseFloat(current.quantity) || 0;
                }
            }
        }

        if (totalDistance === 0) return null;

        // 百公里能耗
        return (totalQuantity / totalDistance * 100).toFixed(2);
    },

    // 获取本月花费
    getMonthlyCost(vehicleId) {
        const stats = this.calculateStats(vehicleId, 'month');
        return stats.total;
    },

    // 获取今年花费
    getYearlyCost(vehicleId) {
        const stats = this.calculateStats(vehicleId, 'year');
        return stats.total;
    },

    // 获取累计花费
    getTotalCost(vehicleId) {
        const stats = this.calculateStats(vehicleId, 'all');
        return stats.total;
    },

    // 获取最近记录
    getRecentRecords(vehicleId, limit = 5) {
        return this.getAllRecords(vehicleId).slice(0, limit);
    },

    // 获取月度趋势数据
    getMonthlyTrend(vehicleId, months = 6) {
        const records = this.getAllRecords(vehicleId);
        const now = new Date();
        const trend = [];

        for (let i = months - 1; i >= 0; i--) {
            const year = now.getFullYear();
            const month = now.getMonth() - i;
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const monthRecords = records.filter(r => {
                const d = new Date(r.date);
                return d >= startDate && d <= endDate;
            });

            let total = 0;
            monthRecords.forEach(r => {
                total += parseFloat(r.amount) || 0;
            });

            trend.push({
                month: `${year}-${String(month + 1).padStart(2, '0')}`,
                total: total
            });
        }

        return trend;
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataModel };
}
