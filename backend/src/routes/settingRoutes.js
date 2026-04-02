const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// 获取所有设置
router.get('/', async (req, res) => {
  try {
    const [settings] = await sequelize.query('SELECT * FROM settings');
    const result = {};
    settings.forEach(s => {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 获取单个设置
router.get('/:key', async (req, res) => {
  try {
    const [settings] = await sequelize.query(
      'SELECT * FROM settings WHERE key = ?',
      { replacements: [req.params.key] }
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ success: false, message: '设置不存在' });
    }
    
    let value;
    try {
      value = JSON.parse(settings[0].value);
    } catch {
      value = settings[0].value;
    }
    
    res.json({ success: true, data: value });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 更新设置
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    await sequelize.query(
      'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
      { replacements: [stringValue, req.params.key] }
    );
    
    res.json({ success: true, message: '设置已更新' });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ success: false, message: '更新设置失败' });
  }
});

module.exports = router;
