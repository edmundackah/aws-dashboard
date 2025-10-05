const { chromium } = require('playwright');

async function fixedStealthMonitor(targetUrl) {
  console.log(`🥷 Fixed stealth monitoring for: ${targetUrl}`);
  console.log('🎭 Browser configured to avoid detection');
  console.log('🔐 DRM support enabled\n');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor,TranslateUI',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      '--disable-background-networking',
      '--enable-widevine-cdm',
      '--allow-running-insecure-content',
      '--ignore-certificate-errors',
      '--disable-popup-blocking',
      '--disable-hang-monitor',
      '--disable-sync',
      '--disable-translate',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--window-size=1366,768'
    ],
    ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: ['microphone', 'camera', 'geolocation', 'notifications'],
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"'
    }
  });

  const page = await context.newPage();

  // Advanced stealth injection
  await page.addInitScript(() => {
    // Remove webdriver property completely
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Remove automation indicators
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    // Mock chrome object properly
    if (!window.chrome) {
      window.chrome = {};
    }
    
    window.chrome.runtime = {
      onConnect: undefined,
      onMessage: undefined,
    };

    // Mock plugins realistically
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return {
          0: {
            name: "Chrome PDF Plugin",
            filename: "internal-pdf-viewer",
            description: "Portable Document Format"
          },
          1: {
            name: "Chrome PDF Viewer", 
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            description: ""
          },
          2: {
            name: "Native Client",
            filename: "internal-nacl-plugin", 
            description: ""
          },
          length: 3
        };
      }
    });

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Mock hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });

    // Mock device memory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // Override permissions
    if (navigator.permissions && navigator.permissions.query) {
      const originalQuery = navigator.permissions.query;
      navigator.permissions.query = function(parameters) {
        return parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery.apply(this, arguments);
      };
    }

    // Mock WebGL renderer info
    const getParameter = WebGLRenderingContext.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter(parameter);
    };
  });

  let requestCount = 0;
  let mediaCount = 0;
  let drmCount = 0;
  let manifestCount = 0;

  // Network monitoring
  page.on('request', request => {
    requestCount++;
    const timestamp = new Date().toLocaleTimeString();
    const url = request.url();
    const headers = request.headers();

    console.log(`[${timestamp}] 📤 #${requestCount}: ${request.method()} ${url}`);

    // DRM detection
    if (url.includes('widevine') || 
        url.includes('playready') || 
        url.includes('fairplay') || 
        url.includes('license') ||
        url.includes('drm') ||
        url.includes('clearkey') ||
        headers['content-type']?.includes('application/octet-stream')) {
      drmCount++;
      console.log(`🔐 DRM #${drmCount}: ${url}`);
    }

    // Media detection
    if (request.resourceType() === 'media' || 
        url.match(/\.(mp4|webm|avi|mov|m3u8|ts|ogg|flv|mpd|dash|m4s)$/i) ||
        headers['content-type']?.includes('video') ||
        headers['content-type']?.includes('audio')) {
      mediaCount++;
      console.log(`🎬 MEDIA #${mediaCount}: ${url}`);
    }

    // Streaming manifest detection
    if (url.includes('.m3u8') || 
        url.includes('.mpd') || 
        url.includes('manifest') ||
        url.includes('playlist') ||
        headers['content-type']?.includes('application/vnd.apple.mpegurl') ||
        headers['content-type']?.includes('application/dash+xml')) {
      manifestCount++;
      console.log(`📺 MANIFEST #${manifestCount}: ${url}`);
    }
  });

  page.on('response', response => {
    const timestamp = new Date().toLocaleTimeString();
    const contentType = response.headers()['content-type'] || '';
    const url = response.url();

    if (response.status() >= 400) {
      console.log(`[${timestamp}] ❌ ${response.status()}: ${url}`);
    } else if (contentType.includes('video') || 
               contentType.includes('audio') ||
               url.match(/\.(mp4|webm|avi|mov|ogg|flv|m4s)$/i)) {
      console.log(`[${timestamp}] 📹 MEDIA [${response.status()}]: ${url}`);
    } else if (contentType.includes('application/octet-stream') || 
               url.includes('license') || 
               url.includes('drm') ||
               url.includes('widevine')) {
      console.log(`[${timestamp}] 🔐 DRM [${response.status()}]: ${url}`);
    }
  });

  // Console monitoring for DRM-related messages
  page.on('console', msg => {
    const text = msg.text().toLowerCase();
    if (msg.type() === 'error') {
      console.log(`🔍 CONSOLE ERROR: ${msg.text()}`);
    } else if (text.includes('drm') || 
               text.includes('widevine') ||
               text.includes('encrypted') ||
               text.includes('license')) {
      console.log(`🔐 DRM LOG: ${msg.text()}`);
    }
  });

  try {
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    console.log(`✅ Loaded: ${targetUrl}`);
    console.log(`🥷 Stealth mode active - monitoring all traffic...\n`);

    // Keep monitoring until browser is closed
    page.on('close', () => {
      console.log('\n📊 SESSION STATS:');
      console.log(`Requests: ${requestCount} | Media: ${mediaCount} | DRM: ${drmCount} | Manifests: ${manifestCount}`);
      console.log('👋 Monitoring session ended');
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

if (require.main === module) {
  const testUrl = process.argv[2];
  if (!testUrl) {
    console.log('Usage: node fixed-stealth-monitor.js <URL>');
    console.log('Example: node fixed-stealth-monitor.js https://netflix.com');
    process.exit(1);
  }
  fixedStealthMonitor(testUrl).catch(console.error);
}

module.exports = { fixedStealthMonitor };
