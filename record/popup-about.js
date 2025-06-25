

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