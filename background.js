chrome.runtime.onInstalled.addListener(() => {
  console.log('Page Saver extension installed.');
  stopAnimation();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Page Saver extension started.');
    stopAnimation();
});

// Listen for the command to save tabs
chrome.commands.onCommand.addListener((command) => {
  if (command === "save-all-tabs") {
    sendTabs();
  }
});

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  sendTabs();
});

let isSending = false;
let animationInterval = null;

async function sendTabs() {
  if (isSending) {
    console.log("Already in the process of sending tabs.");
    return;
  }

  const settings = await chrome.storage.sync.get({
    testWebhook: '',
    liveWebhook: '',
    useLive: false,
    sendAll: true
  });

  const webhookUrl = settings.useLive ? settings.liveWebhook : settings.testWebhook;

  if (!webhookUrl) {
    console.error("Webhook URL is not configured. Please set it in the options page.");
    chrome.runtime.openOptionsPage();
    return;
  }

  isSending = true;
  await startAnimation();

  let tabsToProcess;
  if (settings.sendAll) {
    tabsToProcess = await chrome.tabs.query({currentWindow: true});
  } else {
    const [activeTab] = await chrome.tabs.query({active: true, currentWindow: true});
    tabsToProcess = [activeTab];
  }

  for (const tab of tabsToProcess) {
    if (!tab.url || tab.url.startsWith('chrome://')) {
      console.log(`Skipping tab: ${tab.url || 'new tab'}`);
      continue;
    }

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => document.documentElement.outerHTML,
      });

      const pageContent = result.result;

      const data = {
        "page url": tab.url,
        "page content": pageContent
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log(`Successfully sent tab: ${tab.url}`);
      } else {
        console.error(`Failed to send tab: ${tab.url}. Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error processing tab: ${tab.url}`, error);
    }

    if (settings.sendAll && tabsToProcess.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log("Finished sending tabs.");
  await stopAnimation();
  isSending = false;
}

function drawIcon(ctx, rotation = 0) {
  ctx.clearRect(0, 0, 16, 16);
  ctx.save();
  ctx.translate(8, 8);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-8, -8);

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Arrow
  ctx.beginPath();
  ctx.moveTo(8, 11);
  ctx.lineTo(8, 3);
  ctx.moveTo(5, 8);
  ctx.lineTo(8, 11);
  ctx.lineTo(11, 8);
  
  // Tray
  ctx.moveTo(3, 14);
  ctx.lineTo(13, 14);

  ctx.stroke();
  ctx.restore();
}

async function startAnimation() {
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  let rotation = 0;

  animationInterval = setInterval(() => {
    drawIcon(ctx, rotation);
    const imageData = ctx.getImageData(0, 0, 16, 16);
    chrome.action.setIcon({ imageData: imageData });
    rotation = (rotation + 90) % 360;
  }, 150);
}

async function stopAnimation() {
  clearInterval(animationInterval);
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, 0);
  const imageData = ctx.getImageData(0, 0, 16, 16);
  chrome.action.setIcon({ imageData: imageData });
}