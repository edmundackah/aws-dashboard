const { chromium } = require('playwright');

async function advancedStealthMonitor(targetUrl) {
  console.log(`🔬 Advanced stealth monitoring for: ${targetUrl}`);
  console.log('🤖 Maximum automation detection avoidance');
  console.log('🔐 Full DRM and protected content support\n');
  
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // Use real Chrome if available
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions-except=/path/to/ublock', // Allow specific extensions
      '--load-extension=/path/to/ublock',
      '--user-data-dir=/tmp/chrome-user-data',
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
      '--widevine-cdm-path=/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/Current/Libraries/WidevineCdm/_platform_specific/mac_x64/libwidevinecdm.dylib',
      '--enable-features=NetworkService,NetworkServiceLogging',
      '--allow-running-insecure-content',
      '--ignore-certificate-errors',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
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
    geolocation: { longitude: -74.006, latitude: 40.7128 }, // NYC
    permissions: ['microphone', 'camera', 'geolocation', 'notifications', 'persistent-storage'],
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    forcedColors: 'none',
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

  // Advanced stealth techniques
  await page.addInitScript(() => {
    // Remove webdriver traces
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Mock chrome object
    window.chrome = {
      runtime: {},
      loadTimes: function() {
        return {
          commitLoadTime: Date.now() / 1000 - Math.random(),
          finishDocumentLoadTime: Date.now() / 1000 - Math.random(),
          finishLoadTime: Date.now() / 1000 - Math.random(),
          firstPaintAfterLoadTime: 0,
          firstPaintTime: Date.now() / 1000 - Math.random(),
          navigationType: 'Other',
          npnNegotiatedProtocol: 'h2',
          requestTime: Date.now() / 1000 - Math.random(),
          startLoadTime: Date.now() / 1000 - Math.random(),
          connectionInfo: 'h2',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true
        };
      },
      csi: function() {
        return {
          startE: Date.now(),
          onloadT: Date.now(),
          pageT: Date.now() - Math.random() * 1000,
          tran: 15
        };
      }
    };

    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: Plugin
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          },
          {
            0: {
              type: "application/pdf",
              suffixes: "pdf", 
              description: "",
              enabledPlugin: Plugin
            },
            description: "",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer"
          },
          {
            0: {
              type: "application/x-nacl",
              suffixes: "",
              description: "Native Client Executable",
              enabledPlugin: Plugin
            },
            1: {
              type: "application/x-pnacl",
              suffixes: "",
              description: "Portable Native Client Executable", 
              enabledPlugin: Plugin
            },
            description: "",
            filename: "internal-nacl-plugin",
            length: 2,
            name: "Native Client"
          }
        ];
      }
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

    // Override the permissions API
    if (navigator.permissions && navigator.permissions.query) {
      const originalQuery = navigator.permissions.query;
      navigator.permissions.query = function(parameters) {
        return parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery.apply(this, arguments);
      };
    }
  });

  let requestCount = 0;
  let mediaCount = 0;
  let drmCount = 0;
  let manifestCount = 0;

  // Comprehensive network monitoring
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

  try {
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    console.log(`✅ Loaded: ${targetUrl}`);
    console.log(`🥷 Advanced stealth active - all traffic monitored\n`);

    page.on('close', () => {
      console.log('\n📊 SESSION STATS:');
      console.log(`Requests: ${requestCount} | Media: ${mediaCount} | DRM: ${drmCount} | Manifests: ${manifestCount}`);
      process.exit(0);
    });

    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

if (require.main === module) {
  const testUrl = process.argv[2];
  if (!testUrl) {
    console.log('Usage: node advanced-stealth-monitor.js <URL>');
    process.exit(1);
  }
  advancedStealthMonitor(testUrl).catch(console.error);
}

module.exports = { advancedStealthMonitor };
