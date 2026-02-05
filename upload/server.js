const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors()); // 允许所有前端跨域请求
app.use(express.json());

// ########## 只改这一行！粘贴你的40位Classic PAT ##########
const GITHUB_TOKEN = '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';
// 固定配置（和前端一致，不用改）
const CONFIG = {
  owner: 'HYQY2012',
  repo: 'Data',
  path: 'md data',
  prefix: 'index_',
  suffix: '.md',
  numLength: 4,
  maxNum: 9999
};
// GitHub请求头（后端用，绝对安全）
const GITHUB_HEADERS = {
  'Authorization': `Bearer ${GITHUB_TOKEN.trim()}`,
  'Accept': 'application/vnd.github.v3+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

// 核心接口：获取下一个MD文件名
app.get('/get-next-md', async (req, res) => {
  try {
    // 1. 调用GitHub API获取md data目录文件
    const encodePath = encodeURIComponent(CONFIG.path);
    const githubRes = await axios.get(
      `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${encodePath}`,
      { headers: GITHUB_HEADERS }
    );
    // 2. 筛选index_xxxx.md，提取编号
    const reg = new RegExp(`^${CONFIG.prefix}(\\d{${CONFIG.numLength}})${CONFIG.suffix}$`);
    const numbers = [];
    githubRes.data.forEach(item => {
      if (item.type === 'file' && reg.test(item.name)) {
        const num = parseInt(reg.exec(item.name)[1], 10);
        numbers.push(num);
      }
    });
    // 3. 生成下一个编号并格式化
    let nextNum = 1;
    if (numbers.length > 0) {
      const maxNum = Math.max(...numbers);
      if (maxNum >= CONFIG.maxNum) throw new Error(`已达最大编号 ${CONFIG.prefix}${CONFIG.maxNum.toString().padStart(4,0)}${CONFIG.suffix}`);
      nextNum = maxNum + 1;
    }
    const nextNumStr = nextNum.toString().padStart(CONFIG.numLength, '0');
    const newFileName = `${CONFIG.prefix}${nextNumStr}${CONFIG.suffix}`;
    // 4. 返回给前端（含文件名+上传地址）
    res.json({
      code: 200,
      msg: '成功',
      fileName: newFileName,
      uploadUrl: `https://github.com/${CONFIG.owner}/${CONFIG.repo}/new/main/${encodeURIComponent(`${CONFIG.path}/${newFileName}`)}`
    });
  } catch (err) {
    res.json({
      code: 500,
      msg: err.message || '获取失败'
    });
  }
});

// 启动服务（本地3000端口）
app.listen(3000, () => {
  console.log('✅ 本地代理服务启动成功！地址：http://localhost:3000');
  console.log('✅ 直接打开前端HTML，点击生成即可，无需其他操作！');
});
