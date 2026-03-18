// app.js - 主应用入口

// 全局函数（供 HTML 调用）

// 显示添加记录弹窗
function showAddModal(type) {
    UI.showAddModal(type);
}

// 关闭弹窗
function closeModal() {
    UI.closeModal();
}

// 关闭车辆弹窗
function closeVehicleModal() {
    UI.closeVehicleModal();
}

// 显示添加车辆
function showAddVehicle() {
    UI.showAddVehicle();
}

// 删除车辆
function deleteVehicle(id) {
    if (confirm('确定要删除这辆车吗？所有相关记录也会被删除。')) {
        DataModel.deleteVehicle(id);
        UI.renderVehicleSelect();
        UI.renderVehicles();
        UI.refreshAll();
    }
}

// 导出数据
function exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `car_cost_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 导入数据
function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Storage.importAll(data)) {
                alert('导入成功！');
                UI.init();
            } else {
                alert('导入失败！');
            }
        } catch (err) {
            alert('文件格式错误！');
        }
    };
    reader.readAsText(file);
}

// 清空数据
function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        Storage.clear();
        alert('数据已清空');
        UI.init();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
