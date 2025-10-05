const { chromium } = require('playwright');

async function monitorNetworkTraffic(targetUrl) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const requests = [];
  const responses = [];
  
  // Capture all network activity
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: Date.now()
    });
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers(),
      timestamp: Date.now()
    });
  });
  
  await page.goto(targetUrl);
  
  // Filter for video/media files
  const mediaRequests = requests.filter(req => 
    req.url.match(/\.(mp4|webm|avi|mov|m3u8|ts)$/i) ||
    req.headers['content-type']?.includes('video')
  );
  
  console.log('Media requests found:', mediaRequests.length);
  mediaRequests.forEach(req => console.log(req.url));
  
  await browser.close();
  return { requests, responses, mediaRequests };
}

module.exports = { monitorNetworkTraffic };
