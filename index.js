const axios = require('axios');
const fs = require('fs');

const KEYS = {
    TAVILY: process.env.TAVILY_API_KEY?.trim(),
    OR: process.env.OPENROUTER_API_KEY?.trim()
};

async function main() {
    try {
        if (!KEYS.TAVILY || !KEYS.OR) throw new Error("Missing API Keys");

        console.log("📡 正在检索 BigTech (Tesla, NVIDIA, Apple, Google) 最新动态...");
        
        // 扩展搜索关键词，覆盖你指定的大厂
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: KEYS.TAVILY,
            query: "latest news today on Tesla, NVIDIA, Apple, Google, and AI breakthroughs 2026",
            search_depth: "advanced",
            max_results: 8
        });

        console.log("🧠 AI 正在打磨科技深报...");
        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{
                role: "user",
                content: `你是一个高端科技杂志主编。请根据以下素材写一份中文深度简报。
                素材：${JSON.stringify(searchRes.data.results)}
                要求：
                1. 必须涵盖特斯拉、英伟达、苹果、谷歌等巨头的最新动向。
                2. 使用 HTML 结构：每条新闻用 <div class="card"> 包装，标题用 <h3>，正文用 <p>，链接用 <a>。
                3. 语气要客观、犀利、有前瞻性。
                4. 不要包含任何 markdown 代码块符号。`
            }]
        }, {
            headers: { Authorization: `Bearer ${KEYS.OR}` },
            timeout: 40000 
        });

        const content = aiRes.data.choices[0].message.content.replace(/```html|```/g, '').trim();

        // 这里的 HTML 加入了精心设计的 CSS 样式
        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YLH Daily Updated | 巨头情报局</title>
    <style>
        :root {
            --bg: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --accent: #38bdf8;
            --text: #f1f5f9;
        }
        body { 
            background: var(--bg); 
            color: var(--text); 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; }
        header { 
            text-align: center; 
            padding: 40px 0; 
            border-bottom: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 30px;
        }
        h1 { font-size: 2.5rem; margin: 0; background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .meta { color: var(--accent); font-size: 0.9rem; margin-top: 10px; }
        .card { 
            background: var(--card-bg); 
            backdrop-filter: blur(10px);
            padding: 25px; 
            border-radius: 16px; 
            margin-bottom: 20px; 
            border: 1px solid rgba(255,255,255,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); border-color: var(--accent); }
        h3 { margin-top: 0; color: var(--accent); font-size: 1.4rem; }
        p { color: #cbd5e1; font-size: 1.05rem; }
        a { color: var(--accent); text-decoration: none; font-size: 0.9rem; border: 1px solid var(--accent); padding: 4px 12px; border-radius: 20px; display: inline-block; margin-top: 10px; transition: 0.3s; }
        a:hover { background: var(--accent); color: var(--bg); }
        footer { text-align: center; padding: 40px; color: #64748b; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>AIClaw Intelligence</h1>
            <div class="meta">巨头情报局 · 实时扫描中</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">Update: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}</div>
        </header>
        <main>${content}</main>
        <footer>
            <p>© 2026 AIClaw Agent | Powered by Gemini 2.0 & Tavily</p>
        </footer>
    </div>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log("🚀 深度美化版网页已生成！");

    } catch (error) {
        console.error("💥 Error:", error.message);
        process.exit(1);
    }
}

main();