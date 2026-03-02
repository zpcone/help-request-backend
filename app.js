// 加载环境变量
require('dotenv').config();

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const helpRequestRouter = require('./routes/helpRequest');

const app = new Koa();

// 中间件
app.use(cors());
app.use(bodyParser());

// 路由
app.use(helpRequestRouter.routes());
app.use(helpRequestRouter.allowedMethods());

// 错误处理
app.on('error', (err, ctx) => {
  console.error('Server error:', err);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Help Request Backend server running on port ${PORT}`);
});

module.exports = app;