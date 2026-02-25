const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim()
};

async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("📡 正在采集腾讯、小米、宁德时代等公司深度行情...");
        
        // 专门针对这五家公司搜集影响股价的深度信息
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "stock analysis 2026: Tencent (0700), Xiaomi (1810), HSBC (0005), CATL, CNOOC earnings and market trend",
            search_depth: "advanced",
            max_results: 15
        });

        console.log("🧠 AI 正在生成双板块投资周报...");
        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `你是一个专业的证券分析师。请根据素材完成以下两个任务：
                素材：${JSON.stringify(searchRes.data.results)}
                
                任务 1 (资讯流)：总结 15 条今日最重要的科技/财经新闻。
                任务 2 (投资研报)：分别针对 腾讯、小米、汇丰、宁德时代、中国海洋石油 这 5 家公司，给出：【最新公司消息】【走势回顾】、【核心驱动点】、【投资评级建议】。
                
                要求：
                1. 任务 1 请用 <div class="news-list"> 包装。
                2. 任务 2 请用 <div class="stock-analysis"> 包装。
                3. 使用 HTML 格式，不要 markdown。`
            }]
        }, {
            headers: { Authorization: `Bearer ${KEYS.OR}` },
            timeout: 50000 
        });

        const rawContent = aiRes.data.choices[0].message.content.replace(/```html|```/g, '').trim();

        // 核心代码：双页签 HTML 结构
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YLH AIClaw Alpha | 投资决策看板</title>
    <style>
        :root { --bg: #0a0e17; --card: #151c2c; --accent: #3b82f6; --text: #e2e8f0; }
        body { background: var(--bg); color: var(--text); font-family: sans-serif; margin: 0; padding: 0; }
        .header { background: #111827; padding: 20px; text-align: center; border-bottom: 1px solid #1f2937; }
        h1 { margin: 0; font-size: 1.5rem; color: #fff; }
        
        /* 页签样式 */
        .tabs { display: flex; justify-content: center; background: #111827; border-bottom: 1px solid #1f2937; }
        .tab-btn { padding: 15px 30px; cursor: pointer; border: none; background: none; color: #94a3b8; font-weight: bold; transition: 0.3s; }
        .tab-btn.active { color: var(--accent); border-bottom: 3px solid var(--accent); }
        
        .content-container { max-width: 850px; margin: 20px auto; padding: 0 15px; }
        .tab-content { display: none; animation: fadeIn 0.4s; }
        .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .card { background: var(--card); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #1f2937; }
        h3 { color: var(--accent); margin-top: 0; }
        p { color: #94a3b8; line-height: 1.6; }
        footer { text-align: center; padding: 30px; color: #4b5563; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 AIClaw Alpha 投资决策看板</h1>
        <div style="font-size:0.8rem; color:#64748b; margin-top:5px;">更新于: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}</div>
    </div>

    <div class="tabs">
        <button class="tab-btn active" onclick="openTab(event, 'news')">📡 每日资讯</button>
        <button class="tab-btn" onclick="openTab(event, 'analysis')">📈 深度分析 (个股)</button>
    </div>

    <div class="content-container">
        <div id="news" class="tab-content active">
            ${rawContent.includes('news-list') ? rawContent : '<p>正在加载资讯流...</p>'}
        </div>

        <div id="analysis" class="tab-content">
            ${rawContent.includes('stock-analysis') ? rawContent : '<p>个股研报正在生成中...</p>'}
        </div>
    </div>

    <script>
        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tab-content");
            for (i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
            tablinks = document.getElementsByClassName("tab-btn");
            for (i = 0; i < tablinks.length; i++) tablinks[i].classList.remove("active");
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.classList.add("active");
        }
    </script>
    <footer>© 2026 AIClaw Finance Intelligence | 免责声明：AI 总结不构成投资建议</footer>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("🎉 双页签投资看板已生成！");

    } catch (error) {
        console.error("❌ 错误:", error.message);
        process.exit(1);
    }
}
main();