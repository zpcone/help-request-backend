// 数据库配置 - 支持 MySQL 和 PostgreSQL (Railway)
require('dotenv').config();
const mysql = require('mysql2/promise');

// Railway 会自动提供 DATABASE_URL 环境变量
// 格式: postgres://user:password@host:port/database
let dbConfig;

if (process.env.DATABASE_URL) {
  // 解析 Railway 的 PostgreSQL URL
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    port: url.port || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
} else {
  // 本地开发使用 MySQL 配置
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'help_request_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

// 创建连接池
const pool = mysql.createPool(dbConfig);

module.exports = pool;