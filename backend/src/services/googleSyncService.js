const { exec } = require('child_process');
const { promisify } = require('util');
const { Plan, Todo, Note, FamilyMember, Wish, Assignment, Schedule, StarRecord, HabitRecord, sequelize } = require('../models');

const execAsync = promisify(exec);

// Google Sheets ID - 必须从环境变量配置
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const DOCS_NAME = process.env.GOOGLE_DOCS_NAME || '育儿经验笔记';

if (!SHEETS_ID) {
  console.warn('[GoogleSync] 警告: 未配置 GOOGLE_SHEETS_ID 环境变量，同步功能将不可用');
}

class GoogleSyncService {
  constructor() {
    this.sheetsId = SHEETS_ID;
    this.docsName = DOCS_NAME;
  }

  /**
   * 执行 gog 命令
   */
  async runGogCommand(args) {
    // 从环境变量获取账号
    const account = process.env.GOOGLE_ACCOUNT || 'your-email@gmail.com';
    const argsWithAccount = args.includes('--account') ? args : `${args} --account ${account}`;
    const cmd = `gog ${argsWithAccount}`;
    console.log(`[GoogleSync] 执行: ${cmd}`);
    
    // 设置环境变量
    const env = {
      ...process.env,
      GOG_KEYRING_PASSWORD: process.env.GOG_KEYRING_PASSWORD || 'gogcli-auth-key'
    };
    
    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 60000, env });
      if (stderr) console.warn(`[GoogleSync] stderr: ${stderr}`);
      return stdout;
    } catch (error) {
      console.error(`[GoogleSync] 命令失败: ${cmd}`, error.message);
      throw error;
    }
  }

  /**
   * 同步规划数据到 Google Sheets
   */
  async syncPlansToSheets() {
    try {
      console.log('[GoogleSync] 开始同步规划数据...');
      
      // 获取所有规划数据
      const plans = await Plan.findAll({
        include: [{ model: FamilyMember, as: 'assignee', required: false }],
        order: [['startDate', 'ASC']]
      });

      // 构建表格数据
      const headers = ['ID', '标题', '类型', '学科', '开始日期', '结束日期', '状态', '优先级', '进度', '负责人', '目标分数', '实际分数', '地点', '老师', '费用', '标签', '描述', '创建时间'];
      
      const rows = plans.map(plan => [
        plan.id,
        plan.title || '',
        this.translateType(plan.type),
        plan.subject || '',
        plan.startDate || '',
        plan.endDate || '',
        this.translateStatus(plan.status),
        this.translatePriority(plan.priority),
        `${plan.progress}%`,
        plan.assignee?.name || '',
        plan.targetScore || '',
        plan.actualScore || '',
        plan.location || '',
        plan.teacher || '',
        plan.cost || '',
        Array.isArray(plan.tags) ? plan.tags.join(', ') : '',
        plan.description || '',
        plan.createdAt ? plan.createdAt.toISOString() : ''
      ]);

      // 准备数据
      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      // 先清空现有数据
      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "规划表!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空表格失败，可能表格不存在:', e.message);
      }

      // 写入数据
      const range = `规划表!A1:R${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 规划数据同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'plans' };
    } catch (error) {
      console.error('[GoogleSync] 规划同步失败:', error);
      return { success: false, error: error.message, type: 'plans' };
    }
  }

  /**
   * 同步待办事项到 Google Sheets
   */
  async syncTodosToSheets() {
    try {
      console.log('[GoogleSync] 开始同步待办事项...');
      
      const todos = await Todo.findAll({
        include: [
          { model: FamilyMember, as: 'assignee', required: false },
          { model: Plan, as: 'plan', required: false }
        ],
        order: [['dueDate', 'ASC']]
      });

      const headers = ['ID', '标题', '截止日期', '截止时间', '状态', '优先级', '负责人', '关联规划', '重复', '提醒(分钟)', '描述', '完成时间', '创建时间'];
      
      const rows = todos.map(todo => [
        todo.id,
        todo.title || '',
        todo.dueDate || '',
        todo.dueTime || '',
        this.translateTodoStatus(todo.status),
        this.translatePriority(todo.priority),
        todo.assignee?.name || '',
        todo.plan?.title || '',
        todo.isRecurring ? '是' : '否',
        todo.reminderMinutes || '',
        todo.description || '',
        todo.completedAt ? todo.completedAt.toISOString() : '',
        todo.createdAt ? todo.createdAt.toISOString() : ''
      ]);

      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "待办事项!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空表格失败:', e.message);
      }

      const range = `待办事项!A1:M${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 待办事项同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'todos' };
    } catch (error) {
      console.error('[GoogleSync] 待办同步失败:', error);
      return { success: false, error: error.message, type: 'todos' };
    }
  }

  /**
   * 同步育儿经验笔记到 Google Docs
   */
  async syncNotesToDocs() {
    try {
      console.log('[GoogleSync] 开始同步育儿经验...');
      
      const notes = await Note.findAll({
        include: [
          { model: FamilyMember, as: 'relatedMember', required: false },
          { model: Plan, as: 'relatedPlan', required: false }
        ],
        order: [['isPinned', 'DESC'], ['createdAt', 'DESC']]
      });

      // 构建文档内容
      let docContent = '# William 育儿经验笔记\n\n';
      docContent += `> 最后更新: ${new Date().toLocaleString('zh-CN')}\n\n`;
      docContent += '---\n\n';

      // 分类统计
      const categories = {};
      notes.forEach(note => {
        const cat = note.category || '未分类';
        categories[cat] = (categories[cat] || 0) + 1;
      });

      docContent += '## 📊 笔记统计\n\n';
      Object.entries(categories).forEach(([cat, count]) => {
        docContent += `- ${cat}: ${count} 篇\n`;
      });
      docContent += `\n**总计: ${notes.length} 篇**\n\n`;
      docContent += '---\n\n';

      // 笔记详情
      notes.forEach((note, index) => {
        const pinIcon = note.isPinned ? '📌 ' : '';
        docContent += `## ${pinIcon}${note.title}\n\n`;
        docContent += `**分类:** ${note.category || '未分类'} | `;
        docContent += `**创建时间:** ${note.createdAt ? note.createdAt.toLocaleDateString('zh-CN') : '-'} | `;
        docContent += `**浏览:** ${note.viewCount} 次\n\n`;
        
        if (note.tags && note.tags.length > 0) {
          docContent += `**标签:** ${note.tags.join(', ')}\n\n`;
        }
        
        if (note.relatedMember) {
          docContent += `**相关成员:** ${note.relatedMember.name}\n\n`;
        }
        
        if (note.relatedPlan) {
          docContent += `**相关规划:** ${note.relatedPlan.title}\n\n`;
        }

        docContent += note.content || '';
        docContent += '\n\n---\n\n';
      });

      // 搜索文档ID
      let docId = null;
      try {
        const listOutput = await this.runGogCommand(`docs list --limit 50`);
        const match = listOutput.match(new RegExp(`^\\s*([a-zA-Z0-9_-]+)\\s+.*${this.docsName}`, 'm'));
        if (match) {
          docId = match[1];
        }
      } catch (e) {
        console.warn('[GoogleSync] 获取文档列表失败:', e.message);
      }

      if (docId) {
        // 更新现有文档
        const fs = require('fs');
        const tmpFile = `/tmp/william_notes_${Date.now()}.md`;
        fs.writeFileSync(tmpFile, docContent);
        
        try {
          await this.runGogCommand(`docs update "${docId}" --file "${tmpFile}" --mode replace`);
          fs.unlinkSync(tmpFile);
          console.log(`[GoogleSync] 育儿经验文档更新完成: ${docId}`);
          return { success: true, count: notes.length, type: 'notes', docId };
        } catch (e) {
          fs.unlinkSync(tmpFile);
          throw e;
        }
      } else {
        // 创建新文档
        const fs = require('fs');
        const tmpFile = `/tmp/william_notes_${Date.now()}.md`;
        fs.writeFileSync(tmpFile, docContent);
        
        try {
          const result = await this.runGogCommand(`docs create "${this.docsName}" --file "${tmpFile}"`);
          fs.unlinkSync(tmpFile);
          
          const match = result.match(/([a-zA-Z0-9_-]{20,})/);
          const newDocId = match ? match[1] : null;
          
          console.log(`[GoogleSync] 育儿经验文档创建完成: ${newDocId}`);
          return { success: true, count: notes.length, type: 'notes', docId: newDocId, created: true };
        } catch (e) {
          fs.unlinkSync(tmpFile);
          throw e;
        }
      }
    } catch (error) {
      console.error('[GoogleSync] 笔记同步失败:', error);
      return { success: false, error: error.message, type: 'notes' };
    }
  }

  /**
   * 同步便签到 Google Sheets
   */
  async syncStickyNotesToSheets() {
    try {
      console.log('[GoogleSync] 开始同步便签...');
      
      const notes = await Note.findAll({
        where: { category: 'sticky' },
        order: [['createdAt', 'DESC']]
      });

      const headers = ['ID', '标题', '内容', '颜色', '创建时间'];
      
      const rows = notes.map(note => [
        note.id,
        note.title || '',
        note.content || '',
        note.tags && note.tags[0] ? note.tags[0] : 'yellow',
        note.createdAt ? note.createdAt.toISOString() : ''
      ]);

      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      // 清空现有数据
      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "便签!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空便签表失败:', e.message);
      }

      // 写入数据
      const range = `便签!A1:E${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 便签同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'stickyNotes' };
    } catch (error) {
      console.error('[GoogleSync] 便签同步失败:', error);
      return { success: false, error: error.message, type: 'stickyNotes' };
    }
  }

  /**
   * 从 Google Sheets 导入待办事项
   */
  async importTodosFromSheets() {
    try {
      console.log('[GoogleSync] 开始从 Google Sheets 导入待办事项...');
      
      // 读取 Google Sheets 数据
      const output = await this.runGogCommand(`sheets get "${this.sheetsId}" "待办事项!A2:M100" --json`);
      
      if (!output) {
        console.log('[GoogleSync] 没有待办事项数据可导入');
        return { success: true, count: 0, type: 'import_todos' };
      }
      
      const data = JSON.parse(output);
      const values = data.values || [];
      
      let imported = 0;
      for (const row of values) {
        if (!row[1]) continue; // 跳过空标题
        
        const existingTodo = await Todo.findOne({ where: { title: row[1] } });
        if (!existingTodo) {
          await Todo.create({
            title: row[1],
            dueDate: row[2] || null,
            dueTime: row[3] || null,
            status: this.parseTodoStatus(row[4]),
            priority: this.parsePriority(row[5]),
            description: row[10] || '',
            reminderMinutes: row[9] ? parseInt(row[9]) : null
          });
          imported++;
        }
      }
      
      console.log(`[GoogleSync] 导入了 ${imported} 条待办事项`);
      return { success: true, count: imported, type: 'import_todos' };
    } catch (error) {
      console.error('[GoogleSync] 导入待办事项失败:', error);
      return { success: false, error: error.message, type: 'import_todos' };
    }
  }

  /**
   * 数据库备份
   */
  async backupDatabase() {
    try {
      console.log('[GoogleSync] 开始备份数据库...');
      
      const fs = require('fs');
      const path = require('path');
      
      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const backupFile = path.join(backupDir, `william_backup_${date}_${time}.db`);
      
      // 数据库路径 - 使用绝对路径
      const dbFullPath = '/root/.openclaw/workspace_william/system/backend/data/william_learning.db';
      
      console.log('[GoogleSync] 数据库路径:', dbFullPath);
      console.log('[GoogleSync] 文件存在:', fs.existsSync(dbFullPath));
      
      if (fs.existsSync(dbFullPath)) {
        fs.copyFileSync(dbFullPath, backupFile);
        const fileSize = fs.statSync(backupFile).size;
        console.log(`[GoogleSync] 数据库备份完成: ${backupFile} (${fileSize} bytes)`);
        
        // 清理旧备份（保留最近30天）
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        let cleaned = 0;
        files.forEach(file => {
          const filePath = path.join(backupDir, file);
          const stat = fs.statSync(filePath);
          const daysOld = (now - stat.mtime) / (1000 * 60 * 60 * 24);
          if (daysOld > 30) {
            fs.unlinkSync(filePath);
            cleaned++;
            console.log(`[GoogleSync] 删除旧备份: ${file}`);
          }
        });
        
        return { 
          success: true, 
          file: backupFile, 
          size: fileSize,
          cleaned: cleaned,
          type: 'backup' 
        };
      } else {
        console.warn('[GoogleSync] 数据库文件不存在:', dbFullPath);
        return { success: false, error: '数据库文件不存在: ' + dbFullPath, type: 'backup' };
      }
    } catch (error) {
      console.error('[GoogleSync] 数据库备份失败:', error);
      return { success: false, error: error.message, type: 'backup' };
    }
  }

  /**
   * 同步心愿到 Google Sheets
   */
  async syncWishesToSheets() {
    try {
      console.log('[GoogleSync] 开始同步心愿...');
      
      const wishes = await Wish.findAll({
        order: [['createdAt', 'DESC']]
      });

      const headers = ['ID', '名称', '图标', '描述', '所需星星', '状态', '提交人ID', '审核人ID', '审核时间', '完成时间', '创建时间'];
      
      const rows = wishes.map(wish => [
        wish.id,
        wish.name || '',
        wish.emoji || '🎁',
        wish.description || '',
        wish.starsRequired || 0,
        this.translateWishStatus(wish.status),
        wish.submittedBy || '',
        wish.reviewedBy || '',
        wish.reviewedAt ? wish.reviewedAt.toISOString() : '',
        wish.completedAt ? wish.completedAt.toISOString() : '',
        wish.createdAt ? wish.createdAt.toISOString() : ''
      ]);

      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "心愿单!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空心愿表失败:', e.message);
      }

      const range = `心愿单!A1:K${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 心愿同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'wishes' };
    } catch (error) {
      console.error('[GoogleSync] 心愿同步失败:', error);
      return { success: false, error: error.message, type: 'wishes' };
    }
  }

  /**
   * 同步作业到 Google Sheets
   */
  async syncAssignmentsToSheets() {
    try {
      console.log('[GoogleSync] 开始同步作业...');
      
      const assignments = await Assignment.findAll({
        order: [['createdAt', 'DESC']]
      });

      const headers = ['ID', '标题', '科目', '类型', '截止日期', '状态', '星星奖励', '描述', '完成时间', '创建时间'];
      
      const rows = assignments.map(a => [
        a.id,
        a.title || '',
        a.subject || '',
        a.type || '',
        a.fixedDate || '',
        this.translateAssignmentStatus(a.status),
        a.starsReward || 0,
        a.description || '',
        a.completedAt ? new Date(a.completedAt).toISOString() : '',
        a.createdAt ? new Date(a.createdAt).toISOString() : ''
      ]);

      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "作业布置!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空作业表失败:', e.message);
      }

      const range = `作业布置!A1:J${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 作业同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'assignments' };
    } catch (error) {
      console.error('[GoogleSync] 作业同步失败:', error);
      return { success: false, error: error.message, type: 'assignments' };
    }
  }

  /**
   * 同步星星记录到 Google Sheets
   */
  async syncStarRecordsToSheets() {
    try {
      console.log('[GoogleSync] 开始同步星星记录...');
      
      const records = await StarRecord.findAll({
        order: [['createdAt', 'DESC']],
        limit: 500 // 最近500条记录
      });

      const headers = ['ID', '孩子ID', '类型', '数量', '余额', '描述', '关联ID', '创建时间'];
      
      const rows = records.map(r => [
        r.id,
        r.childId || '',
        this.translateStarType(r.type),
        r.amount || 0,
        r.balance || 0,
        r.description || '',
        r.referenceId || '',
        r.createdAt ? r.createdAt.toISOString() : ''
      ]);

      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "星星记录!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空星星记录表失败:', e.message);
      }

      const range = `星星记录!A1:H${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 星星记录同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'starRecords' };
    } catch (error) {
      console.error('[GoogleSync] 星星记录同步失败:', error);
      return { success: false, error: error.message, type: 'starRecords' };
    }
  }

  /**
   * 同步习惯打卡记录到 Google Sheets
   */
  async syncHabitRecordsToSheets() {
    try {
      console.log('[GoogleSync] 开始同步习惯打卡记录...');
      
      const records = await HabitRecord.findAll({
        order: [['recordDate', 'DESC']],
        limit: 500 // 最近500条记录
      });

      const headers = ['ID', '孩子ID', '习惯类型', '日期', '状态', '星星变化', '备注', '创建时间'];
      
      const rows = records.map(r => [
        r.id,
        r.childId || '',
        this.translateHabitType(r.habitType),
        r.recordDate || '',
        this.translateHabitStatus(r.status),
        r.starsEarned || 0,
        r.note || '',
        r.createdAt ? r.createdAt.toISOString() : ''
      ]);

      const allData = [headers, ...rows];
      const jsonData = JSON.stringify(allData);

      try {
        await this.runGogCommand(`sheets clear "${this.sheetsId}" "习惯打卡!A1:Z1000"`);
      } catch (e) {
        console.warn('[GoogleSync] 清空习惯打卡表失败:', e.message);
      }

      const range = `习惯打卡!A1:H${allData.length}`;
      await this.runGogCommand(`sheets update "${this.sheetsId}" "${range}" --values-json '${jsonData}' --input USER_ENTERED`);

      console.log(`[GoogleSync] 习惯打卡同步完成，共 ${rows.length} 条记录`);
      return { success: true, count: rows.length, type: 'habitRecords' };
    } catch (error) {
      console.error('[GoogleSync] 习惯打卡同步失败:', error);
      return { success: false, error: error.message, type: 'habitRecords' };
    }
  }

  /**
   * 执行完整同步（包含导入和备份）
   */
  async syncAll() {
    console.log('[GoogleSync] 开始完整同步...');
    const results = {
      timestamp: new Date().toISOString(),
      results: []
    };

    // 先导入 Google Sheets 中的数据
    results.results.push(await this.importTodosFromSheets());
    
    // 然后同步本地数据到 Google
    results.results.push(await this.syncPlansToSheets());
    results.results.push(await this.syncTodosToSheets());
    results.results.push(await this.syncStickyNotesToSheets());
    results.results.push(await this.syncNotesToDocs());
    results.results.push(await this.syncWishesToSheets());
    results.results.push(await this.syncAssignmentsToSheets());
    results.results.push(await this.syncStarRecordsToSheets());
    results.results.push(await this.syncHabitRecordsToSheets());
    
    // 最后备份
    results.results.push(await this.backupDatabase());

    const allSuccess = results.results.every(r => r.success);
    console.log(`[GoogleSync] 同步完成，成功率: ${results.results.filter(r => r.success).length}/${results.results.length}`);
    
    return { ...results, allSuccess };
  }

  // 翻译辅助方法
  translateWishStatus(status) {
    const map = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝',
      'completed': '已兑换'
    };
    return map[status] || status;
  }

  translateAssignmentStatus(status) {
    const map = {
      'pending': '待完成',
      'completed': '已完成',
      'expired': '已过期'
    };
    return map[status] || status;
  }

  translateStarType(type) {
    const map = {
      'assignment': '作业',
      'habit': '习惯',
      'wish': '心愿',
      'manual': '手动',
      'habit_undo': '撤销习惯',
      'wish_refund': '心愿退款'
    };
    return map[type] || type;
  }

  translateHabitType(type) {
    const map = {
      'early_sleep': '早睡',
      'early_wake': '早起',
      'pack_bag': '收书包',
      'play_game': '玩游戏',
      'watch_tv': '看电视',
      'incomplete_homework': '漏作业'
    };
    return map[type] || type;
  }

  translateHabitStatus(status) {
    const map = {
      'completed': '完成',
      'failed': '未完成'
    };
    return map[status] || status;
  }

  // 解析辅助方法
  parseTodoStatus(status) {
    const map = {
      '待办': 'pending',
      '进行中': 'in_progress',
      '已完成': 'completed',
      '已取消': 'cancelled'
    };
    return map[status] || 'pending';
  }

  parsePriority(priority) {
    const map = {
      '低': 'low',
      '中': 'medium',
      '高': 'high',
      '紧急': 'urgent'
    };
    return map[priority] || 'medium';
  }

  // 翻译辅助方法
  translateType(type) {
    const map = {
      'course': '课程',
      'competition': '比赛',
      'activity': '活动',
      'exam': '考试',
      'reading': '阅读'
    };
    return map[type] || type;
  }

  translateStatus(status) {
    const map = {
      'planned': '计划中',
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
      'paused': '已暂停'
    };
    return map[status] || status;
  }

  translateTodoStatus(status) {
    const map = {
      'pending': '待办',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return map[status] || status;
  }

  translatePriority(priority) {
    const map = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'urgent': '紧急'
    };
    return map[priority] || priority;
  }
}

module.exports = new GoogleSyncService();
