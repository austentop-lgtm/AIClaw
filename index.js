const axios = require('axios');
const fs = require('fs');

// 从环境变量读取密钥
const TAVILY_KEY = process.env.TAVILY_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function fetchNews() {
    console.log("正在通过 Tavily 搜索最新 AI 资讯...");
    const response = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_KEY,
        query: "latest AI and tech news today 2026",
        search_depth: "advanced",
        max_results: 5
    });
    return response.data.results;
}

async function summarizeNews(newsArray) {
    console.log("正在调用 Gemini 1.5 Flash (v1beta) 生成简报...");
    const prompt = `你是一个科技主编，请根据以下新闻素材，总结成一份简报。
    要求：1. 使用中文；2. 语气专业且幽默；3. 每个条目包含标题、精简总结、原文链接。
    素材如下：${JSON.stringify(newsArray)}`;

    // 终极 URL 格式：使用 v1beta 和最基础的 gemini-1.5-flash 名称
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await axios.post(url, {
        contents: [{
            parts: [{ text: prompt }]
        }]
    }, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.candidates) {
        return response.data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Gemini 返回数据解析失败，请检查 API Key");
    }
}

async function main() {
    try {
        if (!TAVILY_KEY || !GEMINI_KEY) {
            throw new Error("缺少 API Key，请检查 GitHub Secrets 配置！");
        }

        const rawNews = await fetchNews();
        const aiSummary = await summarizeNews(rawNews);

        // 简单的 Markdown 转 HTML 处理（Gemini 常返回 Markdown）
        const formattedSummary = aiSummary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>AIClaw 每日科技精选</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
            <style>
                body { max-width: 800px; margin: 40px auto; line-height: 1.6; }
                .card { background: #f4f4f9; padding: 20px; border-radius: 10px; border-left: 6px solid #4CAF50; }
                .time { color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>🚀 AIClaw 科技每日速报</h1>
            <p class="time">更新时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            <div class="card">${formattedSummary}</div>
            <hr>
            <footer>Powered by Gemini 1.5 & Tavily</footer>
        </body>
        </html>`;

        fs.writeFileSync('index.html', htmlContent);
        console.log("✅ 网页更新成功！");
    } catch (error) {
        console.error("❌ 执行失败:");
        if (error.response) {
            console.error(`状态码: ${error.response.status}`);
            console.error(`错误详情: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

main();