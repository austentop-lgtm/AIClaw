const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim(),
    WECHAT: process.env.WECHAT_SENDKEY?.trim() // 读取微信密钥
};
/ 新增微信推送函数
async function pushToWechat(title, content) {
    if (!KEYS.WECHAT) {
        console.log("⚠️ 未配置 WECHAT_SENDKEY，跳过推送。");
        return;
    }
    try {
        await axios.post(`https://sctapi.ftqq.com/${KEYS.WECHAT}.send`, {
            title: title,
            desp: content
        });
        console.log("📲 微信推送成功！");
    } catch (e) {
        console.error("❌ 微信推送失败:", e.message);
    }
}
async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("🔍 Scanning CNN, BBC, and BigTech market moves...");
        
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "latest top stories from CNN, BBC news; and market updates on Tesla, NVDA, Apple, Google, Tencent, Xiaomi, CATL, CNOOC, HSBC 2026",
            search_depth: "advanced",
            max_results: 20
        });

        console.log(`✅ ${searchRes.data.results.length} headlines captured. AI Categorizing...`);

        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `You are a financial news curator. Based on the data, generate a bilingual report.
                Data: ${JSON.stringify(searchRes.data.results)}
                
                Requirements:
                1. **Categorize** into 3 sections: [AI], [Investment], [Finance]. 
                2. Prioritize Tesla, NVDA, Apple, Google, Tencent, Xiaomi, CATL, HSBC, CNOOC.
                3. Structure for each item:
                   <div class="news-card">
                     <div class="lang-en"><h3>EN Title</h3><p>EN Summary</p><a href="URL" target="_blank">Read More</a></div>
                     <div class="lang-zh"><h3>中文标题</h3><p>中文摘要</p><a href="URL" target="_blank">阅读原文</a></div>
                   </div>
                4. Output pure HTML, no markdown code blocks.`
            }]
        }, {
            headers: { Authorization: `Bearer ${KEYS.OR}` },
            timeout: 60000 
        });

        const content = aiRes.data.choices[0].message.content.replace(/```html|```/g, '').trim();

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIClaw | Global Intelligence</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --accent: #38bdf8; --text: #f1f5f9; }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; margin: 0; padding: 20px 20px 120px 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent); padding-bottom: 15px; margin-bottom: 25px; }
        .toggle-btn { background: var(--accent); color: #000; border: none; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
        
        .news-card { background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .news-card h3 { margin: 0 0 10px 0; color: var(--accent); font-size: 1.25rem; }
        .news-card p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin-bottom: 15px; }
        .news-card a { color: var(--accent); text-decoration: none; font-size: 0.85rem; font-weight: 600; border: 1px solid var(--accent); padding: 4px 12px; border-radius: 6px; }
        .news-card a:hover { background: var(--accent); color: #000; }

        /* Multi-language Logic */
        .lang-zh { display: none; }
        body.zh-mode .lang-zh { display: block; }
        body.zh-mode .lang-en { display: none; }
        body.zh-mode .en-text { display: none; }
        body.zh-mode .zh-text { display: inline; }
        .zh-text { display: none; }

        #chat-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1e293b; padding: 15px; border-top: 1px solid var(--accent); }
        .chat-box { max-width: 800px; margin: 0 auto; display: flex; gap: 10px; }
        #chat-input { flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; }
        #chat-btn { background: var(--accent); border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 <span class="en-text">Alpha Intelligence</span><span class="zh-text">Alpha 财经情报</span></h1>
            <button class="toggle-btn" onclick="document.body.classList.toggle('zh-mode')">
                <span class="en-text">中文</span><span class="zh-text">English</span>
            </button>
        </div>
        <div style="margin-bottom: 20px; font-size: 0.8rem; color: #64748b;">
            <span class="en-text">Topics: AI, Investment, Finance | </span><span class="zh-text">分类：AI、投资、财经 | </span>
            ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}
        </div>
        <main>${content}</main>
    </div>

    <div id="chat-bar">
        <div class="chat-box">
            <input type="text" id="chat-input" placeholder="Query Gemini (Official)... / 咨询 AI...">
            <button id="chat-btn" onclick="sendToAI()">Go</button>
        </div>
    </div>

    <script>
        function sendToAI() {
            const q = document.getElementById('chat-input').value;
            if(q) window.open("https://www.google.com/search?q=" + encodeURIComponent(q), '_blank');
        }
    </script>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("🎉 Themed Bilingual Report Generated!");

        // --- 核心推送逻辑 ---
        const pushTitle = `今日财经/光伏情报已更新`;
        const pushBody = `您关注的资产（特斯拉、腾讯、光伏等）动态已生成。请点击查看详情。`;
        
        await pushToWechat(pushTitle, pushBody);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}
main();