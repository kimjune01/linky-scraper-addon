import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveToDownloads') {
    const url = URL.createObjectURL(new Blob([message.content], { type: 'text/markdown' }));
    chrome.downloads.download({
      url,
      filename: message.filename,
      saveAs: false,
      conflictAction: 'uniquify',
    });
  }
});
