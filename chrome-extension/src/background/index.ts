import 'webextension-polyfill';
import { exampleThemeStorage, getStorageStats } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

// Log storage stats on startup
getStorageStats()
  .then(stats => {
    console.log('[Linky] Storage stats:', stats);
  })
  .catch(console.error);

chrome.runtime.onMessage.addListener(message => {
  if (message.action === 'saveToDownloads') {
    const url = URL.createObjectURL(new Blob([message.content], { type: 'text/markdown' }));
    chrome.downloads.download({
      url,
      filename: message.filename,
      saveAs: false,
      conflictAction: 'uniquify',
    });
  }
  if (message.action === 'getStorageStats') {
    // Handle storage stats request from popup/options page
    getStorageStats()
      .then(stats => {
        chrome.runtime.sendMessage({ action: 'storageStats', stats });
      })
      .catch(console.error);
  }
});
