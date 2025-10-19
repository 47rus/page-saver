document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save-button');
  // IMPORTANT: Replace with your webhook URL
  const webhookUrl = 'https://your-webhook-url.com'; 

  saveButton.addEventListener('click', function() {
    // Disable the button to prevent multiple clicks
    saveButton.disabled = true;
    saveButton.textContent = 'Sending...';

    chrome.tabs.query({currentWindow: true}, function(tabs) {
      sendTabs(tabs, saveButton);
    });
  });

  async function sendTabs(tabs, button) {
    for (const tab of tabs) {
      // Skip tabs that cannot be accessed
      if (!tab.url || tab.url.startsWith('chrome://')) {
        console.log(`Skipping tab: ${tab.url || 'new tab'}`);
        continue;
      }

      try {
        // Inject a content script to get the page's HTML
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => document.documentElement.outerHTML,
        });

        const pageContent = result.result;

        // Prepare the data to send
        const data = {
          "page url": tab.url,
          "page content": pageContent
        };

        // Send the data to the webhook
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

      // Wait for 1 second before the next request
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Re-enable the button when done
    button.disabled = false;
    button.textContent = 'Save Page';
  }
});