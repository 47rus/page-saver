// Saves options to chrome.storage
function save_options() {
  const testWebhook = document.getElementById('test-webhook').value;
  const liveWebhook = document.getElementById('live-webhook').value;
  const useLive = document.getElementById('webhook-switch').checked;
  const sendAll = document.getElementById('mode-switch').checked;

  chrome.storage.sync.set({
    testWebhook: testWebhook,
    liveWebhook: liveWebhook,
    useLive: useLive,
    sendAll: sendAll
  }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status-message');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    testWebhook: '',
    liveWebhook: '',
    useLive: false,
    sendAll: true // Default to sending all tabs
  }, function(items) {
    document.getElementById('test-webhook').value = items.testWebhook;
    document.getElementById('live-webhook').value = items.liveWebhook;
    document.getElementById('webhook-switch').checked = items.useLive;
    document.getElementById('mode-switch').checked = items.sendAll;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('test-webhook').addEventListener('input', save_options);
document.getElementById('live-webhook').addEventListener('input', save_options);
document.getElementById('webhook-switch').addEventListener('change', save_options);
document.getElementById('mode-switch').addEventListener('change', save_options);