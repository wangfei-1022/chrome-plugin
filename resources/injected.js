
// 监听 XMLHttpRequest
(function () {
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    this.addEventListener('load', function () {
      const requestInfo = {
        type: 'xhr',
        url: url,
        method: method,
        status: this.status,
        response: this.responseText
      };
      window.postMessage(requestInfo, '*');
    });
    open.call(this, method, url, async, user, password);
  };
})();
