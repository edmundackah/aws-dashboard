const { chromium } = require('playwright');

async function stealthNetworkMonitor(targetUrl) {
  console.log(`🥷 Starting stealth network monitoring for: ${targetUrl}`);
  console.log('🎭 Browser configured to avoid detection');
  console.log('🔐 DRM support enabled for protected content\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-extensions-http-throttling',
      '--disable-component-extensions-with-background-pages',
      '--disable-ipc-flooding-protection',
      '--enable-features=NetworkService,NetworkServiceLogging',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-background-timer-throttling',
      '--disable-background-networking',
      '--enable-widevine-cdm', // Enable DRM support
      '--allow-running-insecure-content',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: ['microphone', 'camera', 'geolocation', 'notifications'],
    // Enable DRM
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
  });
  
  const page = await context.newPage();
  
  // Remove automation indicators
  await page.addInitScript(() => {
    // Remove webdriver property
    delete Object.getPrototypeOf(navigator).webdriver;
    
    // Mock chrome runtime
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    
    // Hide automation traces
    Object.defineProperty(window, 'chrome', {
      writable: false,
      enumerable: true,
      configurable: false,
      value: {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
        },
      },
    });
  });
  
  let requestCount = 0;
  let mediaCount = 0;
  let drmCount = 0;
  
  // Enhanced network monitoring for DRM content
  page.on('request', request => {
    requestCount++;
    const timestamp = new Date().toLocaleTimeString();
    const url = request.url();
    
    console.log(`[${timestamp}] 📤 REQUEST #${requestCount}: ${request.method()} ${url}`);
    
    // Detect DRM-related requests
    if (url.includes('widevine') || 
        url.includes('playready') || 
        url.includes('fairplay') || 
        url.includes('license') ||
        url.includes('drm') ||
        request.headers()['content-type']?.includes('application/octet-stream')) {
      drmCount++;
      console.log(`🔐 DRM REQUEST #${drmCount}: ${url}`);
    }
    
    // Detect media requests
    if (request.resourceType() === 'media' || 
        url.match(/\.(mp4|webm|avi|mov|m3u8|ts|ogg|flv|mpd|dash)$/i) ||
        request.headers()['content-type']?.includes('video') ||
        request.headers()['content-type']?.includes('audio')) {
      mediaCount++;
      console.log(`🎬 MEDIA #${mediaCount}: ${url}`);
    }
    
    // Detect streaming manifests
    if (url.includes('.m3u8') || url.includes('.mpd') || url.includes('manifest')) {
      console.log(`📺 MANIFEST: ${url}`);
    }
  });
  
  page.on('response', response => {
    const timestamp = new Date().toLocaleTimeString();
    const contentType = response.headers()['content-type'] || '';
    const url = response.url();
    
    // Log important responses
    if (response.status() >= 400) {
      console.log(`[${timestamp}] ❌ ERROR ${response.status()}: ${url}`);
    } else if (contentType.includes('video') || 
               contentType.includes('audio') ||
               url.match(/\.(mp4|webm|avi|mov|ogg|flv)$/i)) {
      console.log(`[${timestamp}] 📹 MEDIA RESPONSE [${response.status()}]: ${url}`);
    } else if (contentType.includes('application/octet-stream') || 
               url.includes('license') || 
               url.includes('drm')) {
      console.log(`[${timestamp}] 🔐 DRM RESPONSE [${response.status()}]: ${url}`);
    }
  });
  
  // Log console messages for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔍 CONSOLE ERROR: ${msg.text()}`);
    } else if (msg.text().toLowerCase().includes('drm') || 
               msg.text().toLowerCase().includes('widevine') ||
               msg.text().toLowerCase().includes('encrypted')) {
      console.log(`🔐 DRM LOG: ${msg.text()}`);
    }
  });
  
  try {
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log(`✅ Page loaded successfully`);
    console.log(`🥷 Stealth mode active - monitoring all traffic...\n`);
    
    // Keep monitoring until browser is closed
    page.on('close', () => {
      console.log('\n📊 FINAL STATS:');
      console.log(`Total requests: ${requestCount}`);
      console.log(`Media files: ${mediaCount}`);
      console.log(`DRM requests: ${drmCount}`);
      console.log('👋 Monitoring ended');
      process.exit(0);
    });
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

if (require.main === module) {
  const testUrl = process.argv[2] || 'https://www.netflix.com/browse';
  stealthNetworkMonitor(testUrl).catch(console.error);
}

module.exports = { stealthNetworkMonitor };
