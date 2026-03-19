// storage.js - API 调用封装

const API_BASE = '/api';

// Token 管理
const Token = {
  get() {
    return localStorage.getItem('token');
  },
  set(token) {
    localStorage.setItem('token', token);
  },
  remove() {
    localStorage.removeItem('token');
  },
  getHeaders() {
    const token = this.get();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};

// 用户相关 API
const UserAPI = {
  async register(username, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '注册失败');
    return data;
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');
    return data;
  },

  async changePassword(oldPassword, newPassword) {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...Token.getHeaders()
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '修改密码失败');
    return data;
  }
};

// 车辆相关 API
const VehicleAPI = {
  async getList() {
    const res = await fetch(`${API_BASE}/vehicles`, {
      headers: Token.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '获取车辆列表失败');
    return data;
  },

  async add(vehicle) {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...Token.getHeaders()
      },
      body: JSON.stringify(vehicle)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '添加车辆失败');
    return data;
  },

  async update(id, vehicle) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...Token.getHeaders()
      },
      body: JSON.stringify(vehicle)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新车辆失败');
    return data;
  },

  async delete(id) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      headers: Token.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除车辆失败');
    return data;
  }
};

// 记录相关 API
const RecordAPI = {
  async getList(vehicleId, type) {
    let url = `${API_BASE}/records/${vehicleId}`;
    if (type && type !== 'all') {
      url += `?type=${type}`;
    }
    const res = await fetch(url, {
      headers: Token.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '获取记录失败');
    return data;
  },

  async add(vehicleId, category, data) {
    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...Token.getHeaders()
      },
      body: JSON.stringify({ vehicleId, category, data })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || '添加记录失败');
    return result;
  },

  async delete(id, category) {
    const res = await fetch(`${API_BASE}/records/${id}?category=${category}`, {
      method: 'DELETE',
      headers: Token.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除记录失败');
    return data;
  }
};

// 统计相关 API
const StatsAPI = {
  async get(vehicleId, period = 'month') {
    const res = await fetch(`${API_BASE}/stats/${vehicleId}?period=${period}`, {
      headers: Token.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '获取统计失败');
    return data;
  }
};

// 设置相关 API
const SettingsAPI = {
  async get() {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: Token.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '获取设置失败');
    return data;
  },

  async update(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...Token.getHeaders()
      },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新设置失败');
    return data;
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Token, UserAPI, VehicleAPI, RecordAPI, StatsAPI, SettingsAPI, API_BASE };
}
