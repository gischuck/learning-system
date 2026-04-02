const { Note } = require('../models');

/**
 * 获取所有笔记
 * GET /api/notes
 */
exports.getAll = async (req, res) => {
  try {
    const { category } = req.query;
    const where = {};

    if (category) where.category = category;

    const notes = await Note.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('获取笔记列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取笔记列表失败：' + error.message
    });
  }
};

/**
 * 获取单个笔记
 * GET /api/notes/:id
 */
exports.getById = async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: '笔记不存在'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('获取笔记详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取笔记详情失败'
    });
  }
};

/**
 * 创建笔记
 * POST /api/notes
 */
exports.create = async (req, res) => {
  try {
    const { title, content, category, isPublic } = req.body;

    const note = await Note.create({
      title,
      content,
      category: category || '育儿',
      isPublic: isPublic !== false,
      createdBy: req.user ? req.user.id : null
    });

    res.json({
      success: true,
      data: note,
      message: '笔记创建成功'
    });
  } catch (error) {
    console.error('创建笔记错误:', error);
    res.status(500).json({
      success: false,
      message: '创建笔记失败'
    });
  }
};

/**
 * 更新笔记
 * PUT /api/notes/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPublic } = req.body;

    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: '笔记不存在'
      });
    }

    await note.update({
      title: title || note.title,
      content: content || note.content,
      category: category !== undefined ? category : note.category,
      isPublic: isPublic !== undefined ? isPublic : note.isPublic
    });

    res.json({
      success: true,
      data: note,
      message: '笔记更新成功'
    });
  } catch (error) {
    console.error('更新笔记错误:', error);
    res.status(500).json({
      success: false,
      message: '更新笔记失败'
    });
  }
};

/**
 * 删除笔记
 * DELETE /api/notes/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await Note.destroy({ where: { id } });

    res.json({
      success: true,
      message: '笔记删除成功'
    });
  } catch (error) {
    console.error('删除笔记错误:', error);
    res.status(500).json({
      success: false,
      message: '删除笔记失败'
    });
  }
};

/**
 * 获取临时便签
 * GET /api/notes/sticky
 */
exports.getStickyNotes = async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { category: 'sticky' },
      order: [['createdAt', 'DESC']]
    });

    // 转换为前端期望的格式
    const formatted = notes.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      color: n.tags && n.tags[0] ? n.tags[0] : 'yellow',
      createdAt: n.createdAt
    }));

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('获取便签错误:', error);
    res.status(500).json({
      success: false,
      message: '获取便签失败'
    });
  }
};

/**
 * 保存临时便签
 * POST /api/notes/sticky
 */
exports.saveStickyNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const userId = req.user ? req.user.id : null;

    // 先删除所有现有便签
    await Note.destroy({ where: { category: 'sticky' } });

    // 批量创建新便签
    if (notes && notes.length > 0) {
      const newNotes = notes.map(n => ({
        title: n.title || '',
        content: n.content || '',
        category: 'sticky',
        tags: [n.color || 'yellow'],
        createdBy: userId
      }));

      await Note.bulkCreate(newNotes);
    }

    res.json({
      success: true,
      message: `保存成功，共 ${notes ? notes.length : 0} 个便签`
    });
  } catch (error) {
    console.error('保存便签错误:', error);
    res.status(500).json({
      success: false,
      message: '保存便签失败'
    });
  }
};