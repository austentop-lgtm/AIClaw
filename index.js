const axios = require('axios');
const fs = require('fs');

const TAVILY_KEY = process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.trim() : null;
const OR_KEY = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : null;

async function main() {
    try {
        console.log("🔍 正在抓取新闻...");
        const searchRes = await axios.post('https://api.tavily.com/search', {
            api_key: TAVILY_KEY,
            query: "AI technology breakthroughs and news February 2026",
            max_results: 5
        });
        const newsData = searchRes.data.results;
        console.log(`✅ 抓取成功！数据量: ${JSON.stringify(newsData).length} 字节`);

        console.log("🤖 正在尝试不同的 AI 路径...");
        
        // 重新编排的“高可用”模型列表
        const models = [
            "google/gemini-2.0-flash-001",           // 2.0 最新版，通常很稳
            "google/gemini-flash-1.5",               // 1.5 标准版
            "deepseek/deepseek-chat",                // DeepSeek 备选
            "meta-llama/llama-3.1-8b-instruct:free"  // Llama 3.1 免费版
        ];

        let summary = "";
        for (const model of models) {
            try {
                console.log(`正在请求模型 [${model}]...`);
                const aiRes = await axios({
                    method: 'post',
                    url: 'https://openrouter.ai/api/v1/chat/completions',
                    headers: {
                        'Authorization': `Bearer ${OR_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        model: model,
                        messages: [{
                            role: "user",
                            content: `你是一个专业的科技主编。请根据以下原始新闻素材，撰写一份中文网页简报。
                            素材：${JSON.stringify(newsData)}
                            要求：
                            1. 用 HTML 格式书写，使用 <h3> 标签做标题，<p> 标签做正文。
                            2. 语气要有科技感。
                            3. 包含原文链接。
                            4. 直接给 HTML 内容，不要包含 markdown 代码块。`
                        }]
                    },
                    timeout: 45000 // 给 AI 45秒思考时间
                });

                summary = aiRes.data.choices[0].message.content;
                if (summary) {
                    console.log(`✨ 成功！由模型 ${model} 生成。`);
                    break;
                }
            } catch (err) {
                const status = err.response ? err.response.status : '网络超时';
                console.warn(`❌ 模型 ${model} 失败 (状态码: ${status})`);
                // 停顿 2 秒再试，防止触发 429 频率限制
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!summary) throw new Error("所有 AI 模型都暂时无法访问，请检查 OpenRouter 额度或稍后再试。");

        const cleanContent = summary.replace(/```html/g, '').replace(/```/g, '').trim();
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AIClaw 每日科技</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
</head>
<body>
    <h1>🚀 AIClaw 科技每日速报</h1>
    <small>更新于：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</small>
    <hr>
    <div>${cleanContent}</div>
    <p style="text-align:center; color:gray; margin-top:50px;">© 2026 AIClaw Agent</p>
</body>
</html>`;

        fs.writeFileSync('index.html', htmlContent);
        console.log("🎉 任务圆满完成！");

    } catch (error) {
        console.error("❌ 致命错误:", error.message);
        process.exit(1);
    }
}
main();