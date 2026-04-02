/**
 * 初始化默认数据
 * 创建默认管理员账户
 */

require('dotenv').config();
const { sequelize, User, FamilyMember } = require('../src/models');

async function initDefaultData() {
  try {
    // 同步数据库
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库已同步');

    // 创建管理员账户（也是家长）
    const [admin, adminCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        displayName: 'William爸爸'
      }
    });
    console.log(`${adminCreated ? '✅ 创建' : '📋 已存在'}管理员账户: admin`);

    // 创建家庭档案
    const [parentProfile, parentProfileCreated] = await FamilyMember.findOrCreate({
      where: { userId: admin.id },
      defaults: {
        userId: admin.id,
        name: 'William爸爸',
        role: 'parent',
        avatar: '👨'
      }
    });

    const [childProfile, childProfileCreated] = await FamilyMember.findOrCreate({
      where: { name: 'William' },
      defaults: {
        name: 'William',
        role: 'child',
        grade: '3年级',
        school: '海淀小学',
        avatar: '👦'
      }
    });

    console.log(`${parentProfileCreated ? '✅ 创建' : '📋 已存在'}家长档案`);
    console.log(`${childProfileCreated ? '✅ 创建' : '📋 已存在'}孩子档案`);

    console.log('\n📚 默认账户信息:');
    console.log('----------------------------------------');
    console.log('管理员/家长: admin / admin123');
    console.log('孩子看板: 无需登录，直接访问');
    console.log('----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

initDefaultData();