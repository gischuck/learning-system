const { Assignment, Plan, Note, Todo, Schedule } = require('../models');
const { Op } = require('sequelize');

// AI API 配置
const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'qwen-plus';

console.log('[AI] 配置:', { 
  hasKey: !!AI_API_KEY, 
  endpoint: AI_API_ENDPOINT, 
  model: AI_MODEL 
});

/**
 * 调用 AI API
 */
async function callAI(messages, context) {
  if (!AI_API_KEY) {
    console.warn('[AI] 未配置 AI_API_KEY，使用本地规则回复');
    return null;
  }

  const systemPrompt = `你是 William 学习规划助手，一个帮助家长管理孩子学习规划的 AI 助手。

当前数据上下文：
${context}

你的职责：
1. 回答关于作业、课程、比赛、待办事项的问题
2. 帮助添加、查询、管理学习相关数据
3. 提供学习建议和提醒
4. 记住对话历史，保持对话连贯性

回复要求：
- 简洁友好，使用中文
- 如果需要添加数据，在回复末尾用 JSON 格式说明操作，例如：
  {"action": "add_assignment", "title": "数学作业", "subject": "math"}
- 支持的操作：add_assignment, add_todo, add_note
- 不要编造数据，只基于提供的上下文回答`;

  try {
    // 构建完整的 API URL
    const apiUrl = AI_API_ENDPOINT.endsWith('/chat/completions') 
      ? AI_API_ENDPOINT 
      : AI_API_ENDPOINT + '/chat/completions';
    
    console.log('[AI] 调用 API:', apiUrl, 'model:', AI_MODEL, 'messages:', messages.length);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] API 调用失败:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[AI] API 响应成功');
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('[AI] API 调用异常:', error.message);
    return null;
  }
}

/**
 * 获取数据上下文（RAG知识库）
 */
async function getContext() {
  try {
    const [assignments, todos, courses, notes, plans, stickyNotes] = await Promise.all([
      Assignment.findAll({ order: [['createdAt', 'DESC']], limit: 20 }),
      Todo.findAll({ order: [['dueDate', 'ASC']], limit: 20 }),
      Schedule.findAll({ order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']] }),
      Note.findAll({ where: { category: { [Op.ne]: 'sticky' } }, order: [['createdAt', 'DESC']], limit: 10 }),
      Plan.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      Note.findAll({ where: { category: 'sticky' }, order: [['createdAt', 'DESC']], limit: 10 })
    ]);

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    let context = '\n========== William 学习规划系统数据 ==========\n';

    // 学习规划
    if (plans.length > 0) {
      context += '\n【学习规划】\n';
      plans.forEach(p => {
        context += `- ${p.title}（${p.type || '未分类'}）状态：${p.status || '计划中'}，进度：${p.progress || '0%'}\n`;
        if (p.description) context += `  描述：${p.description}\n`;
      });
    }

    // 作业
    const activeAssignments = assignments.filter(a => a.status === 'active');
    const completedAssignments = assignments.filter(a => a.status === 'completed');
    
    if (activeAssignments.length > 0) {
      context += '\n【待完成作业】\n';
      activeAssignments.forEach(a => {
        context += `- ${a.title}（${a.subject || '未知科目'}）`;
        if (a.dueTime) context += ` 截止：${a.dueTime}`;
        context += '\n';
      });
    }
    
    if (completedAssignments.length > 0) {
      context += `\n【已完成作业】${completedAssignments.length}个\n`;
    }

    // 待办事项（重点关注近期）
    const today = new Date().toISOString().split('T')[0];
    const urgentTodos = todos.filter(t => t.status === 'pending' && t.dueDate && t.dueDate <= today);
    const upcomingTodos = todos.filter(t => t.status === 'pending' && t.dueDate && t.dueDate > today);
    
    if (urgentTodos.length > 0) {
      context += '\n【紧急待办（已过期或今天截止）】⚠️\n';
      urgentTodos.forEach(t => {
        context += `- ${t.title}（${t.category || '未分类'}）截止：${t.dueDate}\n`;
      });
    }
    
    if (upcomingTodos.length > 0) {
      context += '\n【近期待办】\n';
      upcomingTodos.slice(0, 10).forEach(t => {
        context += `- ${t.title}（${t.category || '未分类'}）截止：${t.dueDate}`;
        if (t.priority === '高') context += ' 🔴紧急';
        context += '\n';
      });
    }

    // 课外班/课程
    if (courses.length > 0) {
      context += '\n【课外班安排】\n';
      const groupedCourses = {};
      courses.forEach(c => {
        const day = weekDays[c.dayOfWeek];
        if (!groupedCourses[day]) groupedCourses[day] = [];
        groupedCourses[day].push(c);
      });
      Object.entries(groupedCourses).forEach(([day, dayCourses]) => {
        context += `${day}：`;
        context += dayCourses.map(c => `${c.title}(${c.startTime}-${c.endTime})`).join('、');
        context += '\n';
      });
    }

    // 育儿笔记摘要
    if (notes.length > 0) {
      context += '\n【育儿笔记】\n';
      notes.forEach(n => {
        context += `- ${n.title}（${n.category || '未分类'}）\n`;
      });
    }

    // 便签（家长提醒）
    if (stickyNotes.length > 0) {
      context += '\n【规划便签】\n';
      stickyNotes.forEach(n => {
        context += `- ${n.title || '无标题'}：${(n.content || '').substring(0, 50)}\n`;
      });
    }

    // 统计摘要
    context += '\n【数据统计】\n';
    context += `- 作业：${assignments.length}个（${activeAssignments.length}待完成，${completedAssignments.length}已完成）\n`;
    context += `- 待办：${todos.filter(t => t.status === 'pending').length}个待处理\n`;
    context += `- 课外班：${courses.length}个\n`;
    context += `- 学习规划：${plans.length}个\n`;

    return context;
  } catch (error) {
    console.error('[AI] 获取上下文失败:', error);
    return '数据获取失败';
  }
}

/**
 * 本地规则回复（AI 不可用时的备选）
 */
async function localReply(message, userId, userName) {
  const lowerMessage = message.toLowerCase();
  let reply = '';

  // 查看作业
  if (lowerMessage.includes('作业') && (lowerMessage.includes('查看') || lowerMessage.includes('有'))) {
    const assignments = await Assignment.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    if (assignments.length === 0) {
      reply = '当前没有待完成的作业。';
    } else {
      reply = `当前有 ${assignments.length} 个待完成的作业：\n\n`;
      assignments.forEach((a, i) => {
        reply += `${i + 1}. ${a.title} (${a.subject || '未知科目'})\n`;
      });
    }
  }
  // 添加作业
  else if (lowerMessage.includes('添加') && lowerMessage.includes('作业')) {
    const titleMatch = message.match(/作业[：:]\s*(.+)/) || message.match(/添加.*作业[:：]?\s*(.+)/);
    const title = titleMatch ? titleMatch[1] : '新作业';
    
    await Assignment.create({
      title,
      type: 'homework',
      subject: 'other',
      taskType: 'once',
      assignedBy: userId,
      assignedByName: userName || '家长',
      status: 'active'
    });
    
    reply = `✅ 作业已添加：${title}`;
  }
  // 课外班/课程
  else if (lowerMessage.includes('课外班') || lowerMessage.includes('课程')) {
    const courses = await Schedule.findAll({
      limit: 10,
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });
    
    if (courses.length === 0) {
      reply = '当前没有课外班记录。';
    } else {
      reply = `当前有 ${courses.length} 个课外班：\n\n`;
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      courses.forEach((c, i) => {
        reply += `${i + 1}. ${weekDays[c.dayOfWeek]} ${c.title} (${c.startTime}-${c.endTime})\n`;
      });
    }
  }
  // 比赛/报名提醒
  else if (lowerMessage.includes('比赛') || lowerMessage.includes('报名')) {
    const todos = await Todo.findAll({
      where: { status: 'pending', category: '比赛' },
      order: [['dueDate', 'ASC']],
      limit: 5
    });
    
    if (todos.length === 0) {
      reply = '近期没有需要报名的比赛。';
    } else {
      reply = `近期有以下比赛需要关注：\n\n`;
      todos.forEach((t, i) => {
        reply += `${i + 1}. ${t.title} - 截止：${t.dueDate}\n`;
      });
    }
  }
  // 统计信息
  else if (lowerMessage.includes('统计') || lowerMessage.includes('多少')) {
    const [assignmentCount, planCount, noteCount, todoCount] = await Promise.all([
      Assignment.count(),
      Plan.count(),
      Note.count({ where: { category: { [Op.ne]: 'sticky' } } }),
      Todo.count()
    ]);
    
    reply = `📊 数据统计：\n`;
    reply += `- 作业：${assignmentCount} 个\n`;
    reply += `- 学习规划：${planCount} 个\n`;
    reply += `- 育儿笔记：${noteCount} 篇\n`;
    reply += `- 待办事项：${todoCount} 个\n`;
  }
  // 育儿笔记
  else if (lowerMessage.includes('笔记') || lowerMessage.includes('育儿')) {
    const notes = await Note.findAll({
      where: { category: { [Op.ne]: 'sticky' } },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    if (notes.length === 0) {
      reply = '还没有育儿笔记。';
    } else {
      reply = `最近的育儿笔记：\n\n`;
      notes.forEach((n, i) => {
        reply += `${i + 1}. ${n.title} (${n.category || '未分类'})\n`;
      });
    }
  }
  // 默认回复
  else {
    reply = `我可以帮你：\n`;
    reply += `- 查看/添加作业\n`;
    reply += `- 查看课外班安排\n`;
    reply += `- 查看比赛报名提醒\n`;
    reply += `- 查看统计数据\n`;
    reply += `- 查看育儿笔记\n\n`;
    reply += `请告诉我具体需要什么帮助？`;
  }

  return reply;
}

/**
 * AI 助手聊天
 * POST /api/assistant/chat
 */
exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }

    const userId = req.user?.id;
    const userName = req.user?.displayName || req.user?.username;

    // 构建对话消息数组
    let messages = [];
    
    // 如果有历史对话，添加进去（最多保留最近10轮）
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-20); // 最多20条消息
      recentHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: message });

    // 先尝试 AI 回复
    if (AI_API_KEY) {
      const context = await getContext();
      const aiReply = await callAI(messages, context);
      
      if (aiReply) {
        // 检查是否有操作指令
        const actionMatch = aiReply.match(/\{"action":\s*"([^"]+)",\s*"title":\s*"([^"]+)"[^}]*\}/);
        if (actionMatch) {
          const action = actionMatch[1];
          const title = actionMatch[2];
          
          if (action === 'add_assignment') {
            await Assignment.create({
              title,
              type: 'homework',
              subject: 'other',
              taskType: 'once',
              assignedBy: userId,
              assignedByName: userName || '家长',
              status: 'active'
            });
          }
        }
        
        return res.json({ success: true, reply: aiReply.replace(/\{[^}]+\}/g, '').trim() });
      }
    }

    // AI 不可用时使用本地规则
    const reply = await localReply(message, userId, userName);
    res.json({ success: true, reply });

  } catch (error) {
    console.error('AI 助手错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};