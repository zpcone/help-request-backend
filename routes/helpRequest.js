const Router = require('koa-router');
const pool = require('../config/db');

const router = new Router({ prefix: '/api/help-requests' });

// 共用响应函数
const successResponse = (ctx, data = null, message = '操作成功') => {
  ctx.body = {
    success: true,
    message,
    data
  };
};

const errorResponse = (ctx, statusCode, message) => {
  ctx.status = statusCode;
  ctx.body = {
    success: false,
    message
  };
};

// 获取所有求助信息（支持标题搜索）
router.get('/', async (ctx) => {
  const { title } = ctx.query;
  
  try {
    let query = 'SELECT * FROM help_requests';
    let params = [];
    
    // 如果提供了标题参数，添加搜索条件
    if (title) {
      query += ' WHERE title LIKE ?';
      params.push(`%${title}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    
    if (title) {
      successResponse(ctx, rows, `根据标题"${title}"搜索成功`);
    } else {
      successResponse(ctx, rows, '获取求助信息成功');
    }
  } catch (error) {
    console.error('获取求助信息失败:', error);
    errorResponse(ctx, 500, '获取求助信息失败');
  }
});

// 创建新的求助信息
router.post('/', async (ctx) => {
  const { title, description, contact } = ctx.request.body;
  
  // 验证必填字段
  if (!title || !description) {
    errorResponse(ctx, 400, '标题和描述是必填项');
    return;
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO help_requests (title, description, contact, created_at) VALUES (?, ?, ?, NOW())',
      [title, description, contact || null]
    );
    
    successResponse(ctx, { id: result.insertId }, '求助信息发布成功');
  } catch (error) {
    console.error('创建求助信息失败:', error);
    errorResponse(ctx, 500, '发布求助信息失败');
  }
});

// 获取单个求助信息
router.get('/:id', async (ctx) => {
  const { id } = ctx.params;
  
  try {
    const [rows] = await pool.execute('SELECT * FROM help_requests WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      errorResponse(ctx, 404, '求助信息不存在');
      return;
    }
    
    successResponse(ctx, rows[0], '获取求助信息成功');
  } catch (error) {
    errorResponse(ctx, 500, '获取求助信息失败');
  }
});

// 删除求助信息
router.delete('/:id', async (ctx) => {
  const { id } = ctx.params;
  
  try {
    // 首先检查记录是否存在
    const [existingRows] = await pool.execute('SELECT id FROM help_requests WHERE id = ?', [id]);
    
    if (existingRows.length === 0) {
      errorResponse(ctx, 404, '求助信息不存在，无法删除');
      return;
    }
    
    // 执行删除操作
    const [result] = await pool.execute('DELETE FROM help_requests WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      successResponse(ctx, null, '求助信息删除成功');
    } else {
      errorResponse(ctx, 500, '删除求助信息失败');
    }
  } catch (error) {
    console.error('删除求助信息失败:', error);
    errorResponse(ctx, 500, '删除求助信息失败');
  }
});

module.exports = router;