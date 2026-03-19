# 🚗 私家车用车成本统计 - 工程设计文档

## 1. 技术选型

### 1.1 核心技术栈
| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 样式（移动端优先） |
| Vanilla JavaScript | 逻辑控制 |
| LocalStorage | 数据持久化 |
| Chart.js | 数据可视化图表 |

### 1.2 第三方库
- **PeerJS**: 不需要（这次是单机应用）
- **Chart.js**: 从 CDN 引入，用于绘制统计图表
- **No Framework**: 不使用 Vue/React，保持轻量

---

## 2. 文件结构

```
car-cost-tracker/
├── index.html              # 主页面（单页应用）
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js             # 主应用逻辑
│   ├── storage.js         # LocalStorage 封装
│   ├── data.js            # 数据模型和计算
│   ├── ui.js              # UI 渲染逻辑
│   └── charts.js          # 图表渲染
├── assets/
│   └── icons/             # 图标资源（可选）
├── manifest.json           # PWA 配置
└── SPEC.md                # 产品需求文档
```

---

## 3. 数据层设计

### 3.1 Storage 封装 (storage.js)
```javascript
// 统一的存储接口
const Storage = {
  get(key)
  set(key, value)
  remove(key)
  clear()
}
```

### 3.2 数据模型
```javascript
// 统一的数据操作接口
const DataModel = {
  // 车辆
  getVehicles()
  addVehicle(vehicle)
  updateVehicle(id, data)
  deleteVehicle(id)

  // 能源记录
  getEnergyRecords(vehicleId, filters)
  addEnergyRecord(record)
  deleteEnergyRecord(id)

  // ... 其他模型类似
}
```

---

## 4. 页面结构（单页应用）

### 4.1 视图管理
```javascript
const Views = {
  current: 'home',  // 当前视图

  show(viewName) {
    // 隐藏所有视图
    // 显示目标视图
    this.current = viewName
  }
}
```

### 4.2 页面路由
| 路由 | 视图 | 描述 |
|------|------|------|
| #home | 首页 | 仪表盘 |
| #record | 记录 | 添加记录 |
| #stats | 统计 | 数据报表 |
| #vehicle | 车辆 | 车辆管理 |
| #settings | 设置 | 应用设置 |

---

## 5. UI 组件设计

### 5.1 组件列表
| 组件 | 描述 |
|------|------|
| TabBar | 底部导航栏 |
| VehicleSelector | 车辆选择器 |
| RecordCard | 记录卡片 |
| StatCard | 统计卡片 |
| FormModal | 表单弹窗 |
| DatePicker | 日期选择器 |
| ConfirmDialog | 确认对话框 |

### 5.2 组件结构
```javascript
// 示例：RecordCard 组件
const RecordCard = {
  render(record) {
    return `<div class="record-card">
      <span class="record-type">${record.type}</span>
      <span class="record-amount">${record.amount}</span>
    </div>`
  }
}
```

---

## 6. 核心计算逻辑

### 6.1 能耗计算
```
百公里能耗 = (本次充电度数/加油升数) / (本次里程 - 上次里程) * 100
```

### 6.2 费用统计
```
总花费 = SUM(能源) + SUM(保养) + SUM(保险) + SUM(日常) + SUM(违章)
```

### 6.3 周期统计
```javascript
function getPeriodStats(records, period) {
  // period: 'week' | 'month' | 'year' | 'all'
  const filtered = records.filter(r => {
    // 根据时间范围过滤
  })
  return {
    total: sum(filtered),
    count: filtered.length,
    avg: sum / count
  }
}
```

---

## 7. PWA 配置

### 7.1 manifest.json
```json
{
  "name": "用车成本统计",
  "short_name": "车本",
  "display": "standalone",
  "start_url": "/",
  "icons": [...]
}
```

### 7.2 离线能力
- 使用 Service Worker 缓存页面资源
- 数据存储在 LocalStorage，无需网络

---

## 8. 部署方案

### 8.1 部署到 GitHub Pages
1. 代码推送到 GitHub 仓库
2. 启用 GitHub Pages（Source: main branch）
3. 访问地址：`https://用户名.github.io/车成本/`

### 8.2 移动端使用
- 添加到主屏幕（iOS/Android）
- 类似原生 App 体验

---

## 9. 开发流程

```
1. 搭建项目结构
2. 实现 Storage 层
3. 实现数据模型
4. 实现页面框架
5. 实现各页面功能
6. 添加图表可视化
7. PWA 配置
8. 测试 & 修复
9. 部署上线
```

---

**文档版本**：v1.0  
**创建日期**：2026-03-18
