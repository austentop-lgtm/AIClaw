const fs = require('fs');

async function main() {
  console.log("AI Agent 开始工作...");
  
  // 这里未来会替换成真正的 AI 搜索 API 调用
  const news = [
    { title: "DeepSeek R1 发布：开源大模型新标杆", link: "https://example.com/1" },
    { title: "OpenAI 发布 Sora 视频生成模型更新", link: "https://example.com/2" }
  ];

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AI 科技每日精选</title>
      <style>
        body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; }
        .news-item { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>今日 AI 科技精选</h1>
      ${news.map(item => `
        <div class="news-item">
          <h3>${item.title}</h3>
          <a href="${item.link}">阅读原文</a>
        </div>
      `).join('')}
      <p style="color: gray;">更新时间: ${new Date().toLocaleString()}</p>
    </body>
    </html>
  `;

  fs.writeFileSync('index.html', htmlContent);
  console.log("网页已生成！");
}

main();