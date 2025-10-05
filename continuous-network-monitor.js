const { chromium } = require('playwright');

async function continuousNetworkMonitor(targetUrl) {
  console.log(`🚀 Starting continuous network monitoring for: ${targetUrl}`);
  console.log('📝 Browser will stay open - close it manually when done');
  console.log('🔄 Network requests will be logged in real-time\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // Keep browser open even if script ends
    devtools: false
  });
  
  const page = await browser.newPage();
  
  let requestCount = 0;
  let mediaCount = 0;
  
  // Real-time network monitoring
  page.on('request', request => {
    requestCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`[${timestamp}] 📤 REQUEST #${requestCount}: ${request.method()} ${request.url()}`);
    
    // Highlight video/media requests
    if (request.resourceType() === 'media' || 
        request.url().match(/\.(mp4|webm|avi|mov|m3u8|ts|ogg|flv)$/i)) {
      mediaCount++;
      console.log(`🎬 MEDIA #${mediaCount}: ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    const timestamp = new Date().toLocaleTimeString();
    const contentType = response.headers()['content-type'] || '';
    
    // Log responses with status codes
    if (response.status() >= 400) {
      console.log(`[${timestamp}] ❌ ERROR ${response.status()}: ${response.url()}`);
    } else if (contentType.includes('video') || 
               response.url().match(/\.(mp4|webm|avi|mov|ogg|flv)$/i)) {
      console.log(`[${timestamp}] 📹 VIDEO RESPONSE [${response.status()}]: ${response.url()}`);
    }
  });
  
  // Handle page errors
  page.on('pageerror', error => {
    console.log(`🚨 PAGE ERROR: ${error.message}`);
  });
  
  // Handle console messages from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔍 CONSOLE ERROR: ${msg.text()}`);
    }
  });
  
  try {
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log(`✅ Page loaded successfully`);
    console.log(`🔄 Monitoring network traffic... (close browser to stop)\n`);
    
    // Keep the script running - it will only end when browser is closed
    page.on('close', () => {
      console.log('\n📊 FINAL STATS:');
      console.log(`Total requests monitored: ${requestCount}`);
      console.log(`Media files detected: ${mediaCount}`);
      console.log('👋 Browser closed - monitoring ended');
      process.exit(0);
    });
    
    // Keep monitoring until browser is manually closed
    await new Promise(() => {}); // Infinite wait
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    await browser.close();
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Monitoring stopped by user');
  process.exit(0);
});

// Run with URL from command line or default
if (require.main === module) {
  const testUrl = process.argv[2] || 'https://archive.org/details/BigBuckBunny';
  
  if (!testUrl.startsWith('http')) {
    console.error('❌ Please provide a valid URL starting with http:// or https://');
    process.exit(1);
  }
  
  continuousNetworkMonitor(testUrl).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { continuousNetworkMonitor };
