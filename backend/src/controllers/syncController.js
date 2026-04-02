const googleSyncService = require('../services/googleSyncService');
const { Plan, Todo, Note, Schedule, Assignment, Wish, StarRecord, HabitRecord } = require('../models');

class SyncController {
  /**
   * 导出所有数据
   */
  async exportData(req, res) {
    try {
      const [plans, todos, notes, schedules, assignments, wishes, starRecords, habitRecords] = await Promise.all([
        Plan.findAll(),
        Todo.findAll(),
        Note.findAll(),
        Schedule.findAll(),
        Assignment.findAll(),
        Wish.findAll(),
        StarRecord.findAll({ limit: 1000, order: [['createdAt', 'DESC']] }),
        HabitRecord.findAll({ limit: 1000, order: [['recordDate', 'DESC']] })
      ]);

      const data = {
        exportTime: new Date().toISOString(),
        version: '2.0',
        data: {
          plans,
          todos,
          notes,
          schedules,
          assignments,
          wishes,
          starRecords,
          habitRecords
        }
      };

      res.json({ success: true, data });
    } catch (error) {
      console.error('[SyncController] 导出失败:', error);
      res.status(500).json({ success: false, message: '导出失败', error: error.message });
    }
  }

  /**
   * 导入数据
   */
  async importData(req, res) {
    try {
      const { data } = req.body;
      
      if (!data || !data.data) {
        return res.status(400).json({ success: false, message: '无效的数据格式' });
      }

      const stats = { plans: 0, todos: 0, notes: 0, schedules: 0, assignments: 0, wishes: 0, starRecords: 0, habitRecords: 0 };

      // 导入规划
      if (data.data.plans && Array.isArray(data.data.plans)) {
        for (const item of data.data.plans) {
          const existing = await Plan.findByPk(item.id);
          if (!existing) {
            await Plan.create(item);
            stats.plans++;
          }
        }
      }

      // 导入待办
      if (data.data.todos && Array.isArray(data.data.todos)) {
        for (const item of data.data.todos) {
          const existing = await Todo.findByPk(item.id);
          if (!existing) {
            await Todo.create(item);
            stats.todos++;
          }
        }
      }

      // 导入笔记
      if (data.data.notes && Array.isArray(data.data.notes)) {
        for (const item of data.data.notes) {
          const existing = await Note.findByPk(item.id);
          if (!existing) {
            await Note.create(item);
            stats.notes++;
          }
        }
      }

      // 导入课程
      if (data.data.schedules && Array.isArray(data.data.schedules)) {
        for (const item of data.data.schedules) {
          const existing = await Schedule.findByPk(item.id);
          if (!existing) {
            await Schedule.create(item);
            stats.schedules++;
          }
        }
      }

      // 导入作业
      if (data.data.assignments && Array.isArray(data.data.assignments)) {
        for (const item of data.data.assignments) {
          const existing = await Assignment.findByPk(item.id);
          if (!existing) {
            await Assignment.create(item);
            stats.assignments++;
          }
        }
      }

      // 导入心愿
      if (data.data.wishes && Array.isArray(data.data.wishes)) {
        for (const item of data.data.wishes) {
          const existing = await Wish.findByPk(item.id);
          if (!existing) {
            await Wish.create(item);
            stats.wishes++;
          }
        }
      }

      // 导入星星记录
      if (data.data.starRecords && Array.isArray(data.data.starRecords)) {
        for (const item of data.data.starRecords) {
          const existing = await StarRecord.findByPk(item.id);
          if (!existing) {
            await StarRecord.create(item);
            stats.starRecords++;
          }
        }
      }

      // 导入习惯打卡
      if (data.data.habitRecords && Array.isArray(data.data.habitRecords)) {
        for (const item of data.data.habitRecords) {
          const existing = await HabitRecord.findByPk(item.id);
          if (!existing) {
            await HabitRecord.create(item);
            stats.habitRecords++;
          }
        }
      }

      res.json({ success: true, message: '数据导入成功', stats });
    } catch (error) {
      console.error('[SyncController] 导入失败:', error);
      res.status(500).json({ success: false, message: '导入失败', error: error.message });
    }
  }

  /**
   * 备份数据库
   */
  async backupDatabase(req, res) {
    try {
      const result = await googleSyncService.backupDatabase();
      if (result.success) {
        res.json({ success: true, message: '数据库备份成功', file: result.file });
      } else {
        res.status(500).json({ success: false, message: '备份失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 备份失败:', error);
      res.status(500).json({ success: false, message: '备份失败', error: error.message });
    }
  }

  /**
   * 同步规划表到 Google Sheets
   */
  async syncPlans(req, res) {
    try {
      const result = await googleSyncService.syncPlansToSheets();
      if (result.success) {
        res.json({ success: true, message: `规划表同步成功，共 ${result.count} 条记录`, data: result });
      } else {
        res.status(500).json({ success: false, message: '规划表同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步规划失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 同步待办事项到 Google Sheets
   */
  async syncTodos(req, res) {
    try {
      const result = await googleSyncService.syncTodosToSheets();
      if (result.success) {
        res.json({ success: true, message: `待办事项同步成功，共 ${result.count} 条记录`, data: result });
      } else {
        res.status(500).json({ success: false, message: '待办事项同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步待办失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 同步育儿经验到 Google Docs
   */
  async syncNotes(req, res) {
    try {
      const result = await googleSyncService.syncNotesToDocs();
      if (result.success) {
        const msg = result.created ? '育儿经验文档创建成功' : '育儿经验文档更新成功';
        res.json({ success: true, message: `${msg}，共 ${result.count} 篇笔记`, data: result });
      } else {
        res.status(500).json({ success: false, message: '育儿经验同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步笔记失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 执行完整同步
   */
  async syncAll(req, res) {
    try {
      console.log('[SyncController] 开始完整同步...');
      const result = await googleSyncService.syncAll();
      
      if (result.allSuccess) {
        res.json({ 
          success: true, 
          message: '所有数据同步成功',
          timestamp: result.timestamp,
          details: result.results
        });
      } else {
        const failed = result.results.filter(r => !r.success);
        res.status(207).json({ 
          success: false, 
          message: `部分同步失败: ${failed.map(f => f.type).join(', ')}`,
          timestamp: result.timestamp,
          details: result.results
        });
      }
    } catch (error) {
      console.error('[SyncController] 完整同步失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 获取同步状态
   */
  async getStatus(req, res) {
    try {
      // 这里可以查询数据库或缓存获取上次同步状态
      res.json({
        success: true,
        status: 'ready',
        message: '同步服务就绪',
        endpoints: {
          syncAll: 'POST /api/sync/all',
          syncPlans: 'POST /api/sync/plans',
          syncTodos: 'POST /api/sync/todos',
          syncNotes: 'POST /api/sync/notes',
          syncWishes: 'POST /api/sync/wishes',
          syncAssignments: 'POST /api/sync/assignments',
          syncStars: 'POST /api/sync/stars',
          syncHabits: 'POST /api/sync/habits'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取状态失败', error: error.message });
    }
  }

  /**
   * 同步心愿到 Google Sheets
   */
  async syncWishes(req, res) {
    try {
      const result = await googleSyncService.syncWishesToSheets();
      if (result.success) {
        res.json({ success: true, message: `心愿同步成功，共 ${result.count} 条记录`, data: result });
      } else {
        res.status(500).json({ success: false, message: '心愿同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步心愿失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 同步作业到 Google Sheets
   */
  async syncAssignments(req, res) {
    try {
      const result = await googleSyncService.syncAssignmentsToSheets();
      if (result.success) {
        res.json({ success: true, message: `作业同步成功，共 ${result.count} 条记录`, data: result });
      } else {
        res.status(500).json({ success: false, message: '作业同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步作业失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 同步星星记录到 Google Sheets
   */
  async syncStars(req, res) {
    try {
      const result = await googleSyncService.syncStarRecordsToSheets();
      if (result.success) {
        res.json({ success: true, message: `星星记录同步成功，共 ${result.count} 条记录`, data: result });
      } else {
        res.status(500).json({ success: false, message: '星星记录同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步星星记录失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }

  /**
   * 同步习惯打卡记录到 Google Sheets
   */
  async syncHabits(req, res) {
    try {
      const result = await googleSyncService.syncHabitRecordsToSheets();
      if (result.success) {
        res.json({ success: true, message: `习惯打卡同步成功，共 ${result.count} 条记录`, data: result });
      } else {
        res.status(500).json({ success: false, message: '习惯打卡同步失败', error: result.error });
      }
    } catch (error) {
      console.error('[SyncController] 同步习惯打卡失败:', error);
      res.status(500).json({ success: false, message: '服务器错误', error: error.message });
    }
  }
}

module.exports = new SyncController();
