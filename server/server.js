const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'car-tracker-secret-key-2024';

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'car_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 认证中间件
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的token' });
  }
};

// ============ 认证接口 ============

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    // 检查用户是否存在
    const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    // 创建默认设置
    await pool.execute('INSERT INTO user_settings (user_id) VALUES (?)', [result.insertId]);

    res.json({ message: '注册成功', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    // 查找用户
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const user = rows[0];

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    // 生成token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: '登录成功', 
      token, 
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改密码
app.post('/api/auth/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.userId]);
    const valid = await bcrypt.compare(oldPassword, rows[0].password);
    
    if (!valid) {
      return res.status(400).json({ error: '原密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId]);

    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 车辆接口 ============

// 获取车辆列表
app.get('/api/vehicles', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加车辆
app.post('/api/vehicles', auth, async (req, res) => {
  try {
    const { name, purchaseDate, purchasePrice, initialMileage } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO vehicles (user_id, name, purchase_date, purchase_price, initial_mileage) VALUES (?, ?, ?, ?, ?)',
      [req.userId, name, purchaseDate, purchasePrice, initialMileage || 0]
    );

    res.json({ message: '添加成功', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新车辆
app.put('/api/vehicles/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, purchaseDate, purchasePrice, initialMileage } = req.body;

    // 验证车辆归属
    const [rows] = await pool.execute('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    await pool.execute(
      'UPDATE vehicles SET name = ?, purchase_date = ?, purchase_price = ?, initial_mileage = ? WHERE id = ?',
      [name, purchaseDate, purchasePrice, initialMileage, id]
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除车辆
app.delete('/api/vehicles/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM vehicles WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 记录接口 ============

// 获取记录
app.get('/api/records/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { type } = req.query;

    // 验证车辆归属
    const [rows] = await pool.execute('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    let query = '';
    let tableName = '';

    switch (type) {
      case 'energy':
        tableName = 'energy_records';
        break;
      case 'maintenance':
        tableName = 'maintenance_records';
        break;
      case 'insurance':
        tableName = 'insurance_records';
        break;
      case 'daily':
        tableName = 'daily_records';
        break;
      case 'violation':
        tableName = 'violation_records';
        break;
      default:
        // 获取所有记录
        const allRecords = [];
        const tables = ['energy_records', 'maintenance_records', 'insurance_records', 'daily_records', 'violation_records'];
        
        for (const table of tables) {
          const [r] = await pool.execute(`SELECT * FROM ${table} WHERE vehicle_id = ? ORDER BY date DESC`, [vehicleId]);
          allRecords.push(...r);
        }
        
        return res.json(allRecords.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }

    if (tableName) {
      const [r] = await pool.execute(`SELECT * FROM ${tableName} WHERE vehicle_id = ? ORDER BY date DESC`, [vehicleId]);
      return res.json(r);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加记录
app.post('/api/records', auth, async (req, res) => {
  try {
    const { vehicleId, category, data } = req.body;

    // 验证金额必须为正数
    if (!data.amount || data.amount <= 0) {
      return res.status(400).json({ error: '金额必须大于0' });
    }
    if (data.points !== undefined && data.points < 0) {
      return res.status(400).json({ error: '扣分不能为负数' });
    }

    // 验证车辆归属
    const [rows] = await pool.execute('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    let tableName = '';
    let fields = '';
    let values = [];

    switch (category) {
      case 'energy':
        tableName = 'energy_records';
        fields = 'vehicle_id, type, amount, quantity, date, mileage, location, note';
        values = [vehicleId, data.type, data.amount, data.quantity, data.date, data.mileage, data.location, data.note];
        break;
      case 'maintenance':
        tableName = 'maintenance_records';
        fields = 'vehicle_id, type, amount, date, mileage, description';
        values = [vehicleId, data.type, data.amount, data.date, data.mileage, data.description];
        break;
      case 'insurance':
        tableName = 'insurance_records';
        fields = 'vehicle_id, type, amount, start_date, end_date';
        values = [vehicleId, data.type, data.amount, data.startDate, data.endDate];
        break;
      case 'daily':
        tableName = 'daily_records';
        fields = 'vehicle_id, type, amount, date, location, description';
        values = [vehicleId, data.type, data.amount, data.date, data.location, data.description];
        break;
      case 'violation':
        tableName = 'violation_records';
        fields = 'vehicle_id, type, amount, points, status, date, location, description';
        values = [vehicleId, data.type, data.amount, data.points || 0, data.status || '未处理', data.date, data.location, data.description];
        break;
      default:
        return res.status(400).json({ error: '无效的类别' });
    }

    const [result] = await pool.execute(
      `INSERT INTO ${tableName} (${fields}) VALUES (${values.map(() => '?').join(', ')})`,
      values
    );

    res.json({ message: '添加成功', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除记录
app.delete('/api/records/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    let tableName = '';
    switch (category) {
      case 'energy': tableName = 'energy_records'; break;
      case 'maintenance': tableName = 'maintenance_records'; break;
      case 'insurance': tableName = 'insurance_records'; break;
      case 'daily': tableName = 'daily_records'; break;
      case 'violation': tableName = 'violation_records'; break;
      default:
        return res.status(400).json({ error: '无效的类别' });
    }

    const [result] = await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 统计接口 ============

// 获取统计数据
app.get('/api/stats/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { period } = req.query;

    // 验证车辆归属
    const [rows] = await pool.execute('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '车辆不存在' });
    }

    // 计算时间范围
    let startDate = new Date('2000-01-01');
    const now = new Date();
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const stats = {
      energy: 0,
      maintenance: 0,
      insurance: 0,
      daily: 0,
      violation: 0,
      total: 0
    };

    const tables = [
      { name: 'energy_records', key: 'energy' },
      { name: 'maintenance_records', key: 'maintenance' },
      { name: 'insurance_records', key: 'insurance' },
      { name: 'daily_records', key: 'daily' },
      { name: 'violation_records', key: 'violation' }
    ];

    for (const table of tables) {
      const dateField = table.name === 'insurance_records' ? 'start_date' : 'date';
      const [r] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM ${table.name} WHERE vehicle_id = ? AND ${dateField} >= ?`,
        [vehicleId, startDate]
      );
      stats[table.key] = parseFloat(r[0].total);
      stats.total += stats[table.key];
    }

    // 计算能耗
    const [energyRecords] = await pool.execute(
      'SELECT * FROM energy_records WHERE vehicle_id = ? ORDER BY date ASC',
      [vehicleId]
    );

    let totalQuantity = 0;
    let totalDistance = 0;

    for (let i = 1; i < energyRecords.length; i++) {
      const current = energyRecords[i];
      const previous = energyRecords[i - 1];
      
      if (current.mileage && previous.mileage) {
        const distance = current.mileage - previous.mileage;
        if (distance > 0) {
          totalDistance += distance;
          totalQuantity += parseFloat(current.quantity) || 0;
        }
      }
    }

    stats.consumption = totalDistance > 0 ? (totalQuantity / totalDistance * 100).toFixed(2) : null;

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ============ 配置接口 ============

// 获取配置
app.get('/api/settings', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM user_settings WHERE user_id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.json({ theme: 'light' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新配置
app.put('/api/settings', auth, async (req, res) => {
  try {
    const { theme, defaultVehicleId } = req.body;
    
    await pool.execute(
      'UPDATE user_settings SET theme = ?, default_vehicle_id = ? WHERE user_id = ?',
      [theme, defaultVehicleId, req.userId]
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
