const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim(),
    WECHAT: process.env.WECHAT_SENDKEY?.trim()
};

// 微信推送函数
async function pushToWechat(title, content) {
    if (!KEYS.WECHAT) {
        console.log("⚠️ No WECHAT_SENDKEY found, skipping notification.");
        return;
    }
    try {
        await axios.post(`https://sctapi.ftqq.com/${KEYS.WECHAT}.send`, {
            title: title,
            desp: content
        });
        console.log("📲 WeChat notification sent!");
    } catch (e) {
        console.error("❌ WeChat notification failed:", e.message);
    }
}

async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("📡 Scanning Global Market & PV Industry Headlines...");
        
        // 这里的 query 你可以根据是“财经版”还是“光伏版”手动微调关键词
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "Top stories CNN, BBC; Tesla, NVDA, Apple, Google, Tencent, Xiaomi, CATL, HSBC, CNOOC market impact 2026",
            search_depth: "advanced",
            max_results: 20
        });

        console.log(`✅ Data fetched. Processing bilingual report...`);

        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `You are a financial editor. Based on the provided news, generate a bilingual list.
                Data: ${JSON.stringify(searchRes.data.results)}
                
                Requirements:
                1. Categorize into: [AI], [Investment], [Finance].
                2. Structure for each item:
                   <div class="news-card">
                     <div class="lang-en"><h3>EN Title</h3><p>EN Summary</p><a href="URL" target="_blank">Read More</a></div>
                     <div class="lang-zh"><h3>中文标题</h3><p>中文摘要</p><a href="URL" target="_blank">阅读原文</a></div>
                   </div>
                3. Pure HTML, no markdown tags.`
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
    <title>AIClaw Intelligence</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --accent: #38bdf8; --text: #f1f5f9; }
        body { background: var(--bg); color: var(--text); font-family: sans-serif; margin: 0; padding: 20px 20px 100px 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent); padding-bottom: 15px; margin-bottom: 20px; }
        .toggle-btn { background: var(--accent); color: #000; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: bold; }
        .news-card { background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.05); }
        .news-card h3 { margin: 0 0 10px 0; color: var(--accent); }
        .news-card p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; }
        .news-card a { color: var(--accent); text-decoration: none; font-size: 0.85rem; font-weight: 600; border: 1px solid var(--accent); padding: 4px 10px; border-radius: 6px; display: inline-block; margin-top: 10px; }
        .lang-zh { display: none; }
        body.zh-mode .lang-zh { display: block; }
        body.zh-mode .lang-en { display: none; }
        body.zh-mode .en-text { display: none; }
        body.zh-mode .zh-text { display: inline; }
        .zh-text { display: none; }
    </style>
</head>
<body class="">
    <div class="container">
        <div class="header">
            <h1>🚀 <span class="en-text">Intelligence</span><span class="zh-text">财经情报</span></h1>
            <button class="toggle-btn" onclick="document.body.classList.toggle('zh-mode')">中/EN</button>
        </div>
        <main>${content}</main>
    </div>
    <script>
        function sendToAI() {
            const q = document.getElementById('chat-input')?.value;
            if(q) window.open("https://www.google.com/search?q=" + encodeURIComponent(q), '_blank');
        }
    </script>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("🎉 index.html generated!");

        // 微信推送
        const pushTitle = `AIClaw Update: ${new Date().toLocaleDateString()}`;
        const pushBody = `Your financial report is ready. Check it here: https://austentop-lgtm.github.io/AIClaw/`;
        await pushToWechat(pushTitle, pushBody);

    } catch (error) {
        console.error("💥 Error:", error.message);
        await pushToWechat("Task Failed", error.message);
        process.exit(1);
    }
}
main();