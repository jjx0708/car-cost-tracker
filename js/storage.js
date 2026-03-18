// storage.js - LocalStorage 封装

const STORAGE_KEYS = {
    VEHICLES: 'car_tracker_vehicles',
    ENERGY: 'car_tracker_energy',
    MAINTENANCE: 'car_tracker_maintenance',
    INSURANCE: 'car_tracker_insurance',
    DAILY: 'car_tracker_daily',
    VIOLATION: 'car_tracker_violation',
    CURRENT_VEHICLE: 'car_tracker_current_vehicle'
};

const Storage = {
    // 获取数据
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    // 存储数据
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    // 清空所有数据
    clear() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    // 获取车辆列表
    getVehicles() {
        return this.get(STORAGE_KEYS.VEHICLES) || [];
    },

    // 保存车辆列表
    saveVehicles(vehicles) {
        return this.set(STORAGE_KEYS.VEHICLES, vehicles);
    },

    // 获取能源记录
    getEnergyRecords() {
        return this.get(STORAGE_KEYS.ENERGY) || [];
    },

    // 保存能源记录
    saveEnergyRecords(records) {
        return this.set(STORAGE_KEYS.ENERGY, records);
    },

    // 获取保养记录
    getMaintenanceRecords() {
        return this.get(STORAGE_KEYS.MAINTENANCE) || [];
    },

    // 保存保养记录
    saveMaintenanceRecords(records) {
        return this.set(STORAGE_KEYS.MAINTENANCE, records);
    },

    // 获取保险记录
    getInsuranceRecords() {
        return this.get(STORAGE_KEYS.INSURANCE) || [];
    },

    // 保存保险记录
    saveInsuranceRecords(records) {
        return this.set(STORAGE_KEYS.INSURANCE, records);
    },

    // 获取日常花费记录
    getDailyRecords() {
        return this.get(STORAGE_KEYS.DAILY) || [];
    },

    // 保存日常花费记录
    saveDailyRecords(records) {
        return this.set(STORAGE_KEYS.DAILY, records);
    },

    // 获取违章记录
    getViolationRecords() {
        return this.get(STORAGE_KEYS.VIOLATION) || [];
    },

    // 保存违章记录
    saveViolationRecords(records) {
        return this.set(STORAGE_KEYS.VIOLATION, records);
    },

    // 获取当前选中的车辆ID
    getCurrentVehicleId() {
        return this.get(STORAGE_KEYS.CURRENT_VEHICLE);
    },

    // 设置当前选中的车辆ID
    setCurrentVehicleId(id) {
        return this.set(STORAGE_KEYS.CURRENT_VEHICLE, id);
    },

    // 导出所有数据
    exportAll() {
        const data = {};
        Object.keys(STORAGE_KEYS).forEach(key => {
            data[key] = this.get(STORAGE_KEYS[key]);
        });
        return data;
    },

    // 导入数据
    importAll(data) {
        try {
            Object.keys(data).forEach(key => {
                if (STORAGE_KEYS[key]) {
                    this.set(STORAGE_KEYS[key], data[key]);
                }
            });
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
};

// 生成 UUID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, STORAGE_KEYS, generateId };
}
