console.log('Background service worker running!');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('接收到的请求信息:', message);
  // 这里可以进一步处理接收到的请求信息，比如存储、分析等
  sendResponse({status: 'ok'});
  return true;
});