const axios = require('axios');
const fs = require('fs');

// 获取环境变量
const TAVILY_KEY = process.env.TAVILY_API_KEY;
const OR_KEY = process.env.OPENROUTER_API_KEY;

async function main() {
    try {
        // 1. 检查 Key 是否存在
        if (!TAVILY_KEY || !OR_KEY) {
            throw new Error("配置错误：请检查 GitHub Secrets 中是否存入了 TAVILY_API_KEY 和 OPENROUTER_API_KEY");
        }

        // 2. 抓取资讯
        console.log("🔍 正在通过 Tavily 抓取全球科技热点...");
        const searchRes = await axios.post('[https://api.tavily.com/search](https://api.tavily.com/search)', {
            api_key: TAVILY_KEY,
            query: "latest AI news and breakthrough February 2026",
            search_depth: "advanced",
            max_results: 5
        });
        const newsData = searchRes.data.results;
        console.log(`✅ 成功抓取到 ${newsData.length} 条原始新闻。`);

        // 3. 多模型轮询请求 AI 总结
        console.log("🤖 正在连接 AI 大脑进行处理...");
        const models = [
            "google/gemini-flash-1.5-8b",
            "meta-llama/llama-3.2-3b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "google/gemini-2.0-flash-exp:free"
        ];

        let summary = "";
        for (const model of models) {
            try {
                console.log(`正在尝试模型: ${model}...`);
                const aiRes = await axios.post('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {
                    model: model,
                    messages: [{
                        role: "user",
                        content: `你是一个科技自媒体主编。请根据以下素材，写一份中文科技简报。
                        素材：${JSON.stringify(newsData)}
                        要求：
                        1. 标题要有吸引力。
                        2. 重点突出，列出 3-5 个核心要点。
                        3. 结尾附带原文链接。
                        4. 只要正文，不要包含任何 markdown 标签或代码块符号。`
                    }]
                }, {
                    headers: {
                        Authorization: `Bearer ${OR_KEY}`,
                        "HTTP-Referer": "[https://github.com/austentop-lgtm/AIClaw](https://github.com/austentop-lgtm/AIClaw)",
                        "X-Title": "AIClaw Daily"
                    },
                    timeout: 20000 // 20秒超时
                });

                summary = aiRes.data.choices[0].message.content;
                if (summary) {
                    console.log(`✨ 模型 ${model} 调用成功！`);
                    break;
                }
            } catch (err) {
                console.warn(`⚠️ 模型 ${model} 暂时不可用，尝试下一个...`);
            }
        }

        if (!summary) throw new Error("所有 AI 模型都罢工了，请稍后再试或检查 OpenRouter 额度。");

        // 4. 清理 AI 可能会带出的 Markdown 标签
        const cleanContent = summary.replace(/```html/g, '').replace(/```/g, '').trim();

        // 5. 生成漂亮的 HTML 网页
        const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIClaw | 科技情报局</title>
    <link rel="stylesheet" href="[https://cdn.jsdelivr.net/npm/water.css@2/out/water.css](https://cdn.jsdelivr.net/npm/water.css@2/out/water.css)">
    <style>
        :root { --background-body: #ffffff; }
        body { max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; }
        .update-time { font-size: 0.85em; color: #666; background: #eee; padding: 5px 10px; border-radius: 4px; display: inline-block; }
        .content-box { margin-top: 30px; border-top: 2px solid #007bff; padding-top: 20px; }
        footer { margin-top: 50px; font-size: 0.8em; text-align: center; color: #999; }
        a { color: #007bff; text-decoration: none; }
        strong { color: #222; }
    </style>
</head>
<body>
    <h1>🚀 AIClaw 科技情报局</h1>
    <div class="update-time">最后更新：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} (北京时间)</div>
    
    <div class="content-box">
        ${cleanContent.replace(/\n/g, '<br>')}
    </div>

    <footer>
        <p>© 2026 AIClaw Agent | Powered by Tavily & OpenRouter</p>
    </footer>
</body>
</html>`;

        // 6. 写入文件
        fs.writeFileSync('index.html', htmlContent);
        console.log("🎉 网页已成功生成！文件名为 index.html");

    } catch (error) {
        console.error("❌ 执行过程中发生致命错误:");
        console.error(error.message);
        process.exit(1);
    }
}

main();