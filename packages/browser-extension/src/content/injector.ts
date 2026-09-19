import browser, { commands } from 'webextension-polyfill';
import { makeViewerURL } from '../utils';

function injectLocalViewerFirefox() {
  // 1. Забираємо СИРИЙ XML-текст файлу, який Firefox уже вивів на екран
  const drawingData = document.body?.textContent || document.documentElement.textContent || '';
  
  if (!drawingData) return;

  const fileUrl = window.location.href;

  // 2. Очищаємо екран
  document.documentElement.innerHTML = '<head></head><body></body>';

  // 3. Створюємо iframe вьювера
  const iframe = document.createElement('iframe');
  const viewerUrl = makeViewerURL(fileUrl);
  
  iframe.src = viewerUrl;
  iframe.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; border:none; z-index:2147483647; background:white;';

  // 4. Передаємо дані у вьювер (через postMessage або sessionStorage, оскільки ми в одному вікні)
  iframe.addEventListener('load', () => {
    iframe.contentWindow?.postMessage({
      command: 'load-drawing',
      drawingData
    }, '*');
  });

  document.body.appendChild(iframe);
}

// Запускаємо тільки в Firefox для протоколу file://
if (window.location.protocol === 'file:') {
  injectLocalViewerFirefox();
}
