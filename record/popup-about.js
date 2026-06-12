// 记录在其他地方去调用service worker里面的background js的方法
// 是通过消息传递的方式去执行对应的service worker里面的background js的方法

// 记录 popup 相关的使用
function callBackgroundMethod (methodName, args = [], success, error) {
  // 检查服务工作线程状态（可选）
  let msg = {
    source: 'popup', // 目标标识
    action: methodName,   // 方法名
    args                   // 参数数组
  }
  chrome.runtime.sendMessage(msg, (response) => {
    // 处理消息发送错误
    if (chrome.runtime.lastError) {
      error(new Error(chrome.runtime.lastError.message));
      return;
    }
    // 处理后台返回的结果
    if (!response || !response.success) {
      error(new Error(response?.error || 'Unknown error'));
      return;
    }
    success(response.data);
  });
}

callBackgroundMethod('getAllDates', [], (data) => {
  var selectElement = document.getElementById("download-select");
  data.forEach(v => {
    var optionElement = document.createElement("option");
    optionElement.text = v;
    optionElement.value = v;
    selectElement.appendChild(optionElement);
  })
})

document.getElementById('file-download').addEventListener('click', function () {
  var selectElement = document.getElementById("download-select");
  callBackgroundMethod('exportLogsByDate', [selectElement.value], (data) => {

  })
});

// 日志记录与使用说明
// 目前只记录了提交报价和查询报价的响应内容
// 舍弃了在popup里面去执行的方式
// 直接放到background里面，在控制台手动执行相应的方法
// 方法说明
// exportLogs 导出所有的日志记录
// 如果传入参数，则默认是对应的日期参数，则只导出那一天的日志
// deleteLogs 删除日志 删除所有的日志记录
// addLogToDatabase 添加日志到IndexedDB
// 基本上是以上的使用方法，如需其他的 以后再进行拓展
