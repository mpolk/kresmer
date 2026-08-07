import browser from 'webextension-polyfill';

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.endsWith('.kre')) {
    // Останавливаем стандартную загрузку/отображение браузером
    browser.tabs.update(tabId, { url: 'about:blank' });

    // Открываем наш Vue-вьювер в этой же вкладке
    const viewerUrl = browser.runtime.getURL(`index.html?file=${encodeURIComponent(changeInfo.url)}&no-infinite-loop=please`);
    browser.tabs.update(tabId, { url: viewerUrl });
  }
});
