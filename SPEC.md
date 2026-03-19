# 🚗 车本 - 用车成本统计

## 1. 项目概述

### 1.1 产品定位
一款面向私家车主的用车成本记录与统计分析工具，支持多用户、数据存储在云端。

### 1.2 技术架构
- **前端**：HTML + CSS + JavaScript（保持现有结构）
- **后端**：Node.js + Express
- **数据库**：MySQL
- **部署**：腾讯云服务器

---

## 2. 功能清单

### 2.1 用户系统
| 功能 | 描述 |
|------|------|
| 用户注册 | 用户名 + 密码 |
| 用户登录 | 返回Token |
| Token鉴权 | 请求头携带Token |
| 修改密码 | 验证原密码后修改 |

### 2.2 车辆管理
| 功能 | 描述 |
|------|------|
| 添加车辆 | 车型、购车日期、裸车价格 |
| 编辑车辆 | 修改车辆信息 |
| 删除车辆 | 级联删除相关记录 |
| 车辆列表 | 查看用户所有车辆 |

### 2.3 记录管理
| 类别 | 子类 |
|------|------|
| 能源 | 充电、加油 |
| 保养 | 小保养、大保养、维修、配件 |
| 保险 | 交强险、商业险 |
| 日常 | 洗车、停车、过路费、其他 |
| 违章 | 违停、闯红灯、超速、其他 |

### 2.4 配置
| 功能 | 描述 |
|------|------|
| 主题设置 | 深色/浅色 |
| 默认车辆 | 登录后默认选择的车辆 |

### 2.5 统计
| 功能 | 描述 |
|------|------|
| 月度花费 | 本月总花费 |
| 年度花费 | 本年总花费 |
| 累计花费 | 所有花费 |
| 分类统计 | 各类别占比 |
| 能耗统计 | 百公里电耗/油耗 |

---

## 3. 数据库设计

### 3.1 用户表 (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 车辆表 (vehicles)
```sql
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  initial_mileage INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3.3 能源记录表 (energy_records)
```sql
CREATE TABLE energy_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type ENUM('charge', 'fuel') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2),
  date DATE NOT NULL,
  mileage INT,
  location VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

### 3.4 保养记录表 (maintenance_records)
```sql
CREATE TABLE maintenance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  mileage INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

### 3.5 保险记录表 (insurance_records)
```sql
CREATE TABLE insurance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

### 3.6 日常记录表 (daily_records)
```sql
CREATE TABLE daily_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

### 3.7 违章记录表 (violation_records)
```sql
CREATE TABLE violation_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  points INT DEFAULT 0,
  status VARCHAR(20) DEFAULT '未处理',
  date DATE NOT NULL,
  location VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

### 3.8 用户配置表 (user_settings)
```sql
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  theme VARCHAR(20) DEFAULT 'light',
  default_vehicle_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. API 接口设计

### 4.1 认证
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/password | 修改密码 |

### 4.2 车辆
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/vehicles | 获取车辆列表 |
| POST | /api/vehicles | 添加车辆 |
| PUT | /api/vehicles/:id | 更新车辆 |
| DELETE | /api/vehicles/:id | 删除车辆 |

### 4.3 记录
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/records/:vehicleId | 获取记录列表 |
| POST | /api/records | 添加记录 |
| DELETE | /api/records/:id | 删除记录 |

### 4.4 统计
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/stats/:vehicleId | 统计数据 |

### 4.5 配置
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/settings | 获取配置 |
| PUT | /api/settings | 更新配置 |

---

## 5. 开发计划

### Phase 1：后端基础
- [ ] MySQL 安装
- [ ] 数据库表创建
- [ ] 用户认证API
- [ ] 车辆CRUD API
- [ ] 记录CRUD API
- [ ] 统计API

### Phase 2：前端对接
- [ ] 登录/注册页面
- [ ] Token管理
- [ ] 数据对接
- [ ] 配置功能

### Phase 3：部署
- [ ] 服务器环境配置
- [ ] 部署上线

---

**文档版本**：v1.0  
**更新日期**：2026-03-19
