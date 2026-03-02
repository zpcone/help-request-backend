const Router = require('koa-router');
const pool = require('../config/db');

const router = new Router({ prefix: '/api/help-requests' });

// 获取所有求助信息
router.get('/', async (ctx) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM help_requests ORDER BY created_at DESC');
    ctx.body = {
      success: true,
      data: rows
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取求助信息失败'
    };
  }
});

// 创建新的求助信息
router.post('/', async (ctx) => {
  const { title, description, contact } = ctx.request.body;
  
  // 验证必填字段
  if (!title || !description) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '标题和描述是必填项'
    };
    return;
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO help_requests (title, description, contact, created_at) VALUES (?, ?, ?, NOW())',
      [title, description, contact || null]
    );
    
    ctx.body = {
      success: true,
      message: '求助信息发布成功',
      data: { id: result.insertId }
    };
  } catch (error) {
    console.error('创建求助信息失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '发布求助信息失败'
    };
  }
});

// 获取单个求助信息
router.get('/:id', async (ctx) => {
  const { id } = ctx.params;
  
  try {
    const [rows] = await pool.execute('SELECT * FROM help_requests WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '求助信息不存在'
      };
      return;
    }
    
    ctx.body = {
      success: true,
      data: rows[0]
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取求助信息失败'
    };
  }
});

module.exports = router;