const { body, param, query, validationResult } = require('express-validator');

// 处理验证结果
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
};

// 用户验证规则
const userValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('用户名长度必须在2-50个字符之间'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度至少为6个字符'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('邮箱格式不正确'),
    handleValidationErrors
  ],
  login: [
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    handleValidationErrors
  ]
};

// 家庭成员验证规则
const familyMemberValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('姓名不能为空'),
    body('relation')
      .isIn(['father', 'mother', 'child', 'other'])
      .withMessage('关系类型无效'),
    handleValidationErrors
  ],
  update: [
    param('id')
      .isInt()
      .withMessage('ID必须是整数'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('姓名不能为空'),
    handleValidationErrors
  ]
};

// 学习规划验证规则
const planValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('标题不能为空'),
    body('type')
      .isIn(['course', 'competition', 'activity', 'exam', 'reading'])
      .withMessage('规划类型无效'),
    body('startDate')
      .isDate()
      .withMessage('开始日期格式不正确'),
    body('endDate')
      .optional()
      .isDate()
      .withMessage('结束日期格式不正确'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('优先级无效'),
    handleValidationErrors
  ],
  update: [
    param('id')
      .isInt()
      .withMessage('ID必须是整数'),
    handleValidationErrors
  ]
};

// 笔记验证规则
const noteValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('标题不能为空'),
    body('content')
      .notEmpty()
      .withMessage('内容不能为空'),
    handleValidationErrors
  ]
};

// 待办事项验证规则
const todoValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('标题不能为空'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('优先级无效'),
    body('dueDate')
      .optional()
      .isDate()
      .withMessage('截止日期格式不正确'),
    handleValidationErrors
  ]
};

// 时间线验证规则
const timelineValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('标题不能为空'),
    body('eventDate')
      .isDate()
      .withMessage('事件日期格式不正确'),
    body('eventType')
      .isIn(['milestone', 'achievement', 'reminder', 'exam', 'competition', 'activity', 'birthday'])
      .withMessage('事件类型无效'),
    handleValidationErrors
  ]
};

// ID参数验证
const idParamValidation = [
  param('id')
    .isInt()
    .withMessage('ID必须是整数'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  userValidation,
  familyMemberValidation,
  planValidation,
  noteValidation,
  todoValidation,
  timelineValidation,
  idParamValidation
};
