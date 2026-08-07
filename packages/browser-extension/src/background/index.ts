import browser from 'webextension-polyfill';

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.endsWith('.kre')) {
    // Останавливаем стандартную загрузку/отображение браузером
    browser.tabs.update(tabId, { url: 'about:blank' });

    // Открываем наш Vue-вьювер в этой же вкладке
    const viewerUrl = browser.runtime.getURL(`src/viewer/viewer.html?file=${encodeURIComponent(changeInfo.url)}`);
    browser.tabs.update(tabId, { url: viewerUrl });
  }
});
