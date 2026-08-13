/***************************************************************************\
 *                            🕸 KresMer 🕸
 *       "Kreslennya Merezh" - network diagram editor and viewer
 *      Copyright (C) 2022-2026 Dmitriy Stepanenko. All Rights Reserved.
 * -----------------------------------------------------------------------
 *              Browser extension service worker script
 ***************************************************************************/

import browser from 'webextension-polyfill';

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.endsWith('.kre') && !(new URL(changeInfo.url)).protocol.includes('-extension')) {
    // Stop the current tab from loading the .kre file directly by navigating to a blank page first
    browser.tabs.update(tabId, { url: 'about:blank' });

    // Open the viewer page with the .kre file URL as a query parameter
    const viewerUrl = browser.runtime.getURL(`src/viewer.html?file=${encodeURIComponent(changeInfo.url)}`);
    browser.tabs.update(tabId, { url: viewerUrl });
  }
});
