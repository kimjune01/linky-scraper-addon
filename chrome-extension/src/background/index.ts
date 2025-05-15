import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

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
  if (message.action === 'sendNativeMarkdown') {
    console.log('Sending native message');
    chrome.runtime.sendNativeMessage(
      'com.hoarder.hoard', // Native messaging host name
      message,
      response => {
        if (chrome.runtime.lastError) {
          console.error('Native message error:', chrome.runtime.lastError.message);
        } else {
          console.log('Native message response:', response);
        }
      },
    );
  }
});
