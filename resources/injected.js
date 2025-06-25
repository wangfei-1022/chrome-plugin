
// 监听 XMLHttpRequest
(function () {
  const OriginalXHR = window.XMLHttpRequest;

  window.XMLHttpRequest = function () {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    xhr.open = function (method, url, async, user, password) {
      this._method = method;
      this._url = url;
      const requestInfo = {
        type: 'xhr',
        url: url,
        method: method,
        status: this.status,
        response: this.responseText
      };
      window.postMessage(requestInfo, '*');
      return originalOpen.apply(this, arguments);
    };

    const originalSetRequestHeader = xhr.setRequestHeader;
    xhr.setRequestHeader = function (header, value) {
      if (!this._requestHeaders) {
        this._requestHeaders = [];
      }
      this._requestHeaders.push({
        name: header,
        value: value
      });
      return originalSetRequestHeader.apply(this, arguments);
    };

    const originalSend = xhr.send;
    xhr.send = function (data) {
      this._requestBody = data;
      if (this._url) {
        const requestInfo = {
          id: Date.now().toString(), // 生成唯一ID
          url: this._url,
          method: this._method,
          headers: this._requestHeaders || [],
          body: this._requestBody,
          timestamp: Date.now(),
          type: 'xhr'
        }
        window.postMessage(requestInfo, '*');
      }
      return originalSend.apply(this, arguments);
    };

    return xhr;
  };
})();

