const axios = require('axios');
const fs = require('fs');

const TAVILY_KEY = process.env.TAVILY_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

async function fetchNews() {
    console.log("正在搜索最新的 AI 资讯...");
    const response = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_KEY,
        query: "latest AI and technology news today 2026",
        search_depth: "advanced",
        max_results: 5
    });
    return response.data.results;
}

async function summarizeNews(newsArray) {
    console.log("正在使用 Gemini 进行总结...");
    const prompt = `你是一个科技主编...素材如下：${JSON.stringify(newsArray)}`;
    
    // 替换为 Gemini 的 API 格式
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        contents: [{ parts: [{ text: prompt }] }]
    });
    return response.data.candidates[0].content.parts[0].text;
}

async function main() {
    try {
        const rawNews = await fetchNews();
        const aiSummary = await summarizeNews(rawNews);

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AIClaw | 每日科技精选</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
            <style>
                body { max-width: 800px; margin: 40px auto; padding: 20px; }
                .update-time { font-size: 0.8em; color: #888; }
                article { background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 5px solid #007bff; }
            </style>
        </head>
        <body>
            header><h1>🚀 AIClaw 科技每日速报</h1></header>
            <p class="update-time">最后更新：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            <main>
                <article>${aiSummary.replace(/\n/g, '<br>')}</article>
            </main>
            <footer><p>© 2026 Powered by OpenClaw Agent</p></footer>
        </body>
        </html>`;

        fs.writeFileSync('index.html', htmlContent);
        console.log("✨ 真正的新闻网页已生成！");
    } catch (error) {
    if (error.response) {
        // 这会打印出到底是哪个接口报的 402
        console.error(`API 报错 [${error.config.url}]:`, error.response.status, error.response.data);
    } else {
        console.error("网络或其他错误:", error.message);
    }
    process.exit(1);
    }
}

main();