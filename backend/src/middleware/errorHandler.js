// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: messages
    });
  }

  // Sequelize 唯一性约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => `${e.path} 已存在`);
    return res.status(409).json({
      success: false,
      message: '数据重复',
      errors: messages
    });
  }

  // Sequelize 外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }

  // 自定义错误
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // 默认错误响应
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message: message
  });
};

// 404 处理
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
};

module.exports = {
  errorHandler,
  notFound
};
