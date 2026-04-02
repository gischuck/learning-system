#!/usr/bin/env node
/**
 * 从 Google Sheets 导入数据到 SQLite 数据库
 * 
 * 用法: node sheetsImport.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const execAsync = promisify(exec);

// Google Sheets ID - 必须从环境变量配置
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const ACCOUNT = process.env.GOOGLE_ACCOUNT;

if (!SHEETS_ID) {
  console.error('错误: 未配置 GOOGLE_SHEETS_ID 环境变量');
  console.error('请在 .env 文件中配置: GOOGLE_SHEETS_ID=your_sheets_id');
  process.exit(1);
}

// 颜色输出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

/**
 * 执行 gog 命令
 */
async function runGog(args) {
  const cmd = `gog ${args} --account ${ACCOUNT}`;
  const env = {
    ...process.env,
    GOG_KEYRING_PASSWORD: process.env.GOG_KEYRING_PASSWORD || 'gogcli-auth-key'
  };
  
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 60000, env });
    return stdout;
  } catch (error) {
    console.error(`命令失败: ${cmd}`, error.message);
    throw error;
  }
}

/**
 * 从 Google Sheets 读取数据
 */
async function readSheet(sheetName, range) {
  try {
    const output = await runGog(`sheets get "${SHEETS_ID}" "${sheetName}!${range}" --json`);
    if (!output) return [];
    
    const data = JSON.parse(output);
    return data.values || [];
  } catch (error) {
    log('yellow', `读取 ${sheetName} 失败:`, error.message);
    return [];
  }
}

/**
 * 导入心愿数据（从"心愿单"工作表）
 */
async function importWishes() {
  log('yellow', '导入心愿数据...');
  const data = await readSheet('心愿单', 'A2:L100');
  
  if (data.length === 0) {
    log('green', '没有心愿数据');
    return [];
  }
  
  // 跳过标题行，解析数据
  const wishes = data.slice(1).filter(row => row[1]).map(row => ({
    name: row[1] || '',
    emoji: row[2] || '🎁',
    description: row[3] || '',
    starsRequired: parseInt(row[4]) || 0,
    status: parseWishStatus(row[5]),
    // 其他字段...
  }));
  
  log('green', `找到 ${wishes.length} 条心愿数据`);
  return wishes;
}

/**
 * 导入课外班数据（从"课外班表"工作表）
 * 注意：课外班表是横向布局，需要特殊解析
 */
async function importSchedules() {
  log('yellow', '导入课外班数据...');
  const data = await readSheet('课外班表', 'A1:M20');
  
  if (data.length < 5) {
    log('green', '没有课外班数据');
    return [];
  }
  
  const schedules = [];
  
  // 解析横向布局
  // 第4行是时间段标题【周一至周日课外班】
  // 第5-7行是上午的课程
  // 后面是下午/晚上的课程
  
  // 周一到周日的列索引 (B=周一, C=周二, ..., H=周日)
  const dayCols = [1, 2, 3, 4, 5, 6, 7]; // B到H列
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  // 遍历每一行（课程名、时间、地点）
  for (let rowIdx = 4; rowIdx < data.length - 2; rowIdx += 3) {
    const nameRow = data[rowIdx] || [];
    const timeRow = data[rowIdx + 1] || [];
    const locRow = data[rowIdx + 2] || [];
    
    // 检查是否是时间段标题（如"上午"、"下午"、"晚上"）
    const firstCell = nameRow[0] || '';
    if (firstCell.includes('周') || firstCell === '' || firstCell.includes('【')) {
      continue;
    }
    
    // 遍历每一天的列
    for (let colIdx = 0; colIdx < 7; colIdx++) {
      const col = dayCols[colIdx];
      const courseName = nameRow[col] || '';
      const timeStr = timeRow[col] || '';
      const location = locRow[col] || '';
      
      if (courseName && courseName.trim()) {
        // 解析时间（格式如 "10:30-12:00"）
        const times = timeStr.split('-');
        const startTime = times[0] || '10:00';
        const endTime = times[1] || '12:00';
        
        // 推断科目
        let subject = 'other';
        if (courseName.includes('数学') || courseName.includes('C++')) subject = 'math';
        else if (courseName.includes('英语')) subject = 'english';
        else if (courseName.includes('体测') || courseName.includes('羽毛球') || courseName.includes('游泳')) subject = 'sports';
        else if (courseName.includes('写字') || courseName.includes('书法')) subject = 'art';
        
        schedules.push({
          title: courseName.trim(),
          subject,
          dayOfWeek: colIdx + 1, // 1=周一, ..., 7=周日
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          location: location.trim(),
          type: '课外'
        });
      }
    }
  }
  
  log('green', `找到 ${schedules.length} 条课外班数据`);
  return schedules;
}

function parseWishStatus(status) {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s.includes('完成') || s.includes('兑换')) return 'completed';
  if (s.includes('审核') || s.includes('待')) return 'pending';
  if (s.includes('拒绝')) return 'rejected';
  return 'pending';
}

/**
 * 主函数
 */
async function main() {
  log('blue', '=== 从 Google Sheets 导入数据 ===');
  log('blue', `Sheets ID: ${SHEETS_ID}`);
  log('blue', `Account: ${ACCOUNT}`);
  console.log('');
  
  // 1. 导入心愿数据
  const wishes = await importWishes();
  
  // 2. 导入课外班数据
  const schedules = await importSchedules();
  
  console.log('');
  log('blue', '=== 数据汇总 ===');
  console.log('心愿:', wishes.length);
  console.log('课外班:', schedules.length);
  
  // 保存课外班到数据库
  if (schedules.length > 0) {
    log('yellow', '保存课外班到数据库...');
    
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('/root/.openclaw/workspace_william/system/backend/data/william_learning.db');
    
    // 获取用户 ID
    db.get('SELECT id FROM users LIMIT 1', [], (err, user) => {
      if (err || !user) {
        log('red', '无法获取用户ID');
        return;
      }
      
      const userId = user.id;
      let inserted = 0;
      
      schedules.forEach(schedule => {
        // 检查是否已存在
        db.get('SELECT id FROM schedules WHERE title = ? AND day_of_week = ?', 
          [schedule.title, schedule.dayOfWeek], 
          (err, existing) => {
            if (!existing) {
              db.run(`
                INSERT INTO schedules (title, subject, day_of_week, start_time, end_time, location, type, created_by, created_at, updated_at, status, color)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'active', '#4A90D9')
              `, [
                schedule.title,
                schedule.subject,
                schedule.dayOfWeek,
                schedule.startTime,
                schedule.endTime,
                schedule.location,
                schedule.type,
                userId
              ], (err) => {
                if (!err) inserted++;
              });
            }
          }
        );
      });
      
      setTimeout(() => {
        log('green', `插入了 ${inserted} 条课外班数据`);
        db.close();
      }, 2000);
    });
  }
}

main().catch(console.error);