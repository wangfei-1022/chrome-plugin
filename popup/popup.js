
let userDefineInfo = {
  priceDiffBase: null,
  retryOnFailure: null,
  lowestPrice: null
}

function setUserDefineInfo (userDefineInfo) {
  // 保存设置到 storage
  chrome.storage.local.set({
    userDefineInfo: userDefineInfo
  });

  // 向 content script 发送消息
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'userDefineInfo',
      userDefineInfo: userDefineInfo
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', function () {
      console.log(`You clicked: ${this.textContent}`);

      const activeButtons = document.querySelectorAll('button.active');
      activeButtons.forEach(activeButton => {
        activeButton.classList.remove('active')
      })

      // 当前附加 移除其他
      button.classList.add('active')
      userDefineInfo.priceDiffBase = this.textContent
      setUserDefineInfo(userDefineInfo)
    });
  });

  // 获取 checkbox 元素
  const checkbox = document.getElementById('my-checkbox');
  // 监听 change 事件
  checkbox.addEventListener('change', function () {
    // 保存设置到 storage
    userDefineInfo.retryOnFailure = this.checked ? 1 : 2
    setUserDefineInfo(userDefineInfo)
  });

  
  // 获取 checkbox 元素
  const lowestPrice = document.getElementById('lowest-price');

  // 监听 input 事件
  lowestPrice.addEventListener('input', function () {
    this.value = this.value.replace(/[^\d.]/g,'')
    // 保存设置到 storage
    userDefineInfo.lowestPrice = this.value
    setUserDefineInfo(userDefineInfo)
  });


  // 从 storage 中获取之前的设置
  chrome.storage.local.get(['userDefineInfo'], function (result) {
    if (result.userDefineInfo) {
      userDefineInfo = result.userDefineInfo

      let diffBase = userDefineInfo.priceDiffBase
      buttons.forEach(button => {
        if (button.textContent == diffBase) {
          button.classList.add('active')
        }
      })
      checkbox.checked = userDefineInfo.retryOnFailure === 1 ? true : false;
      lowestPrice.value = userDefineInfo.lowestPrice
    }
  });

}); 
