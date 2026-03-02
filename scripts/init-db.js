// 数据库初始化脚本 - 支持 MySQL 和 PostgreSQL
const fs = require('fs');
const path = require('path');

// 根据环境选择数据库客户端
let dbClient;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  // PostgreSQL
  const { Client } = require('pg');
  dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // MySQL
  const mysql = require('mysql2/promise');
  dbClient = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'help_request_db',
    port: process.env.DB_PORT || 3306
  });
}

async function runInitScript() {
  try {
    // 连接数据库
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      await dbClient.connect();
    } else {
      await dbClient;
    }

    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 如果是 PostgreSQL，需要转换 SQL 语法
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      // 转换 MySQL 特定语法到 PostgreSQL
      sqlContent = sqlContent
        .replace(/SET NAMES utf8mb4;/g, '') // PostgreSQL 不需要
        .replace(/CREATE DATABASE IF NOT EXISTS help_request_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;/g, '')
        .replace(/USE help_request_db;/g, '')
        .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, 'SERIAL PRIMARY KEY')
        .replace(/VARCHAR\(\d+\)/g, 'TEXT') // PostgreSQL TEXT 更灵活
        .replace(/DATETIME/g, 'TIMESTAMP WITH TIME ZONE')
        .replace(/NOW\(\)/g, 'NOW()')
        .replace(/DROP TRIGGER IF EXISTS.*?;;/gs, '') // 移除触发器（PostgreSQL 用其他方式处理时间戳）
        .replace(/DELIMITER ;;.*?DELIMITER ;/gs, ''); // 移除触发器定义

      // PostgreSQL 使用 DEFAULT NOW() 处理时间戳
      sqlContent = sqlContent.replace(
        /created_at DATETIME DEFAULT NULL,\s+updated_at DATETIME DEFAULT NULL/g,
        'created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
      );

      // 移除示例数据中的 contact 字段（如果表结构不匹配）
      // 在 PostgreSQL 中直接执行创建表和插入语句
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS help_requests (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          contact TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const insertDataSql = `
        INSERT INTO help_requests (title, description, contact) VALUES
        ('需要帮忙搬家具', '这周末要搬家，需要2-3个人帮忙搬一些大件家具，地点在朝阳区', '13800138000'),
        ('寻找编程导师', '想学习前端开发，希望能找到有经验的导师指导一下', 'zhang@example.com')
        ON CONFLICT DO NOTHING;
      `;

      await dbClient.query(createTableSql);
      await dbClient.query(insertDataSql);
    } else {
      // MySQL 直接执行原 SQL
      const statements = sqlContent.split(';;').filter(stmt => stmt.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await dbClient.execute(stmt);
        }
      }
    }

    console.log('✅ 数据库初始化成功！');
    
    // 关闭连接
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
      await dbClient.end();
    }
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runInitScript();
}