
// 监听 XMLHttpRequest
(function () {
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
    let arr = [
      'https://crma.iccec.cn/apis/crma/bid/bidc/dealSupBiddingHallQuoteMat',
      'https://crma.iccec.cn/apis/crma/bid/bidc/qryBiddingHallMatQuote',
      'https://crma.iccec.cn/apis/crma/bid/bidc/qryBiddingHallPackageQuote',
      'https://crma.iccec.cn/apis/crma/bid/bidc/qryBiddingBidPricePrepare',
      'https://crma.iccec.cn/apis/crma/bid/bidc/getSystemCurrentTime',

      'http://192.168.20.34:9529/api/chrome/plugin/qry',
      'http://192.168.20.34:9529/api/chrome/plugin/prepare',
      'http://192.168.20.34:9529/api/chrome/plugin/deal'
    ]
    if(arr.includes(url)) {
        console.log(url)
        this.addEventListener('load', function () {
          const requestInfo = {
            requestType: 'SUCCESS',
            type: 'xhr',
            url: url,
            method: method,
            status: this.status,
            response: this.responseText
          };
          window.postMessage(requestInfo, '*');
        });
    }
    open.call(this, method, url, async, user, password);
  };
})();
