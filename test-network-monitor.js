const { chromium } = require('playwright');

async function monitorNetworkTraffic(targetUrl) {
  console.log(`Starting network monitoring for: ${targetUrl}`);
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const requests = [];
  const responses = [];
  
  // Capture all network activity
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      timestamp: Date.now()
    });
    
    // Log video/media requests in real-time
    if (request.resourceType() === 'media' || 
        request.url().match(/\.(mp4|webm|avi|mov|m3u8|ts)$/i)) {
      console.log(`🎬 MEDIA REQUEST: ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type'] || '',
      timestamp: Date.now()
    });
    
    // Log video responses
    if (response.headers()['content-type']?.includes('video') ||
        response.url().match(/\.(mp4|webm|avi|mov)$/i)) {
      console.log(`📹 VIDEO RESPONSE: ${response.url()} [${response.status()}]`);
    }
  });
  
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // Wait a bit for any additional requests
    await page.waitForTimeout(3000);
    
    // Filter for video/media files
    const mediaRequests = requests.filter(req => 
      req.resourceType === 'media' ||
      req.url.match(/\.(mp4|webm|avi|mov|m3u8|ts)$/i)
    );
    
    const videoResponses = responses.filter(resp =>
      resp.contentType.includes('video') ||
      resp.url.match(/\.(mp4|webm|avi|mov)$/i)
    );
    
    console.log('\n📊 RESULTS SUMMARY:');
    console.log(`Total requests: ${requests.length}`);
    console.log(`Total responses: ${responses.length}`);
    console.log(`Media requests found: ${mediaRequests.length}`);
    console.log(`Video responses found: ${videoResponses.length}`);
    
    if (mediaRequests.length > 0) {
      console.log('\n🎬 MEDIA FILES DETECTED:');
      mediaRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url}`);
      });
    }
    
  } catch (error) {
    console.error('Error during monitoring:', error.message);
  } finally {
    await browser.close();
  }
  
  return { requests, responses, mediaRequests: requests.filter(req => 
    req.resourceType === 'media' || req.url.match(/\.(mp4|webm|avi|mov|m3u8|ts)$/i)
  )};
}

// Run with a safe test URL - using Internet Archive as example
if (require.main === module) {
  const testUrl = process.argv[2] || 'https://archive.org/details/BigBuckBunny';
  monitorNetworkTraffic(testUrl).then(() => {
    console.log('✅ Network monitoring completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { monitorNetworkTraffic };
