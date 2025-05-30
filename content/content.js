console.log("content running!");

let userDefineInfo = {
  priceDiffBase: 5,
  retryOnFailure: 1,
  lowestPrice: null
}

// 当前点击的table的报价按钮
let recordStartBtn = null
let running = false

// 代码注入到宿主页面
var injected = document.createElement('script');
injected.src = chrome.runtime.getURL('resources/injected.js');
console.log('引入js脚本', injected);
injected.onload = function () {
  this.remove();
};
document.getElementsByTagName('head')[0].appendChild(injected);
window.addEventListener('message', function (e) {
  // 输出监听的请求内容
  // console.log("插件的请求监听结果：", e.data);

  let xhrItem = e.data

  console.log(xhrItem.url)

  // 有值说明是通过启动开始的
  if (recordStartBtn) {
    if (xhrItem.url === 'http://localhost:9529/api/chrome/plugin/deal' || xhrItem.url === 'https://crma.iccec.cn/apis/crma/bid/bidc/dealSupBiddingHallQuoteMat') {
      let res = JSON.parse(xhrItem.response)
      // 提交后如果设置了继续提交则还需要 再次点击报价
      if (res.code === "0") {
        recordStartBtn.click()
      }
    }

    if ((xhrItem.url === 'http://localhost:9529/api/chrome/plugin/qry' || xhrItem.url === 'https://crma.iccec.cn/apis/crma/bid/bidc/qryBiddingHallMatQuote') && !running) {
      let res = JSON.parse(xhrItem.response)

      // 当有人报价比你低
      if (res.data.minimumPrice < Number(res.data.lastPriceAmount)) {
        // 执行开始
        running = true
        // 传入别人的最低价进行再次计算提交
        let flag = submitQuote(res.data.minimumMoney);
        // 执行完成
        if (flag) {
          // 说明到达最后的提交，大致等待提交完成 方可进行下一次轮询
          setTimeout(() => {
            running = false
          }, 500)
        } else {
          running = false
        }
      }
    }

    if (xhrItem.url === 'http://localhost:9529/api/chrome/plugin/prepare' || xhrItem.url === 'https://crma.iccec.cn/apis/crma/bid/bidc/qryBiddingBidPricePrepare') {
      let res = JSON.parse(xhrItem.response)
      // 超过时间则终止监听
      if (new Date().getTime() > new Date(res.data.biddingEndTime).getTime()) {
        recordStartBtn = null
        closePriceDialog()
      }
    }
  }
});

function closePriceDialog () {
  let targetDialog = getPriceDialog()
  let footer = targetDialog.querySelector('.el-dialog__header');
  let closeBtn = footer.querySelector('.el-dialog__headerbtn');
  closeBtn.click()
}

// 等待元素出现的辅助函数
function waitForElement (selectors) {
  if (typeof selectors === 'string') {
    selectors = [selectors];
  }

  return new Promise(resolve => {
    // 检查是否已存在任何一个选择器对应的元素
    for (const selector of selectors) {
      let element;
      if (selector.startsWith('/')) {
        // XPath
        element = document.evaluate(
          selector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
      } else {
        // CSS 选择器
        element = document.querySelector(selector);
      }
      if (element) {
        return resolve(element);
      }
    }

    const observer = new MutationObserver(mutations => {
      for (const selector of selectors) {
        let element;
        if (selector.startsWith('/')) {
          // XPath
          element = document.evaluate(
            selector,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
        } else {
          // CSS 选择器
          element = document.querySelector(selector);
        }
        if (element) {
          observer.disconnect();
          resolve(element);
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function getTargetText (node) {
  let text = ''
  let nextNode = node.nextElementSibling
  if (nextNode) {
    const firstChild = nextNode.firstElementChild;
    if (firstChild) {
      text = firstChild.textContent;
    }
  }
  return text
}

function isNumber (str) {
  if (str === "" || str === undefined || typeof str === null) {
    return false
  }
  return !isNaN(Number(str)) && isFinite(Number(str));
}

function getPriceDialog () {
  const dialogList = document.querySelectorAll('.el-dialog');
  let targetDialog = null
  dialogList.forEach(dialog => {
    Array.from(dialog.attributes).forEach(v => {
      // 找到报价弹窗
      if (v.name === 'aria-label' && v.textContent === "我要报价") {
        targetDialog = dialog
      }
    })
  });
  return targetDialog
}

//  报价弹窗显示出来之后，进行提交报价操作
function submitQuote (currentLowestPriceError) {
  // 正在执行
  if (!running) {
    return
  }
  let targetDialog = getPriceDialog()

  if (targetDialog) {
    let currentLowestPrice, startPrice, quantity, discountMultipleInput, myQuotePrice
    // 获取最低价格
    let labels = targetDialog.querySelectorAll('.el-form-item__label')
    labels.forEach(v => {
      // 提示当前最低价比当前提交的要低的时候
      if (currentLowestPriceError && isNumber(currentLowestPriceError)) {
        currentLowestPrice = Number(currentLowestPriceError)
      } else {
        if (v.textContent === '当前最低价(元)：') {
          let str = getTargetText(v)
          currentLowestPrice = Number(str.replace(/,/g, '').trim());
        }
      }

      if (v.textContent === '起拍单价(元)：') {
        let str = getTargetText(v)
        startPrice = Number(str.replace(/,/g, '').trim());
      }

      if (v.textContent === '数量：') {
        let str = getTargetText(v)
        quantity = Number(str.replace(/吨/g, '').replace(/,/g, '').trim());
      }

      if (v.textContent === '降价倍数：') {
        discountMultipleInput = v.parentNode.querySelector('input.el-input__inner')
      }


      if (v.textContent === '上一轮报价(元)：') {
        let str = getTargetText(v)
        myQuotePrice = Number(str.replace(/,/g, '').trim());
      }
    })

    if (!isNumber(currentLowestPrice)) {
      console.log("当前最低价(元)：不是数字类型数据")
      return
    }
    if (!isNumber(startPrice)) {
      console.log("起拍单价(元)：：不是数字类型数据")
      return
    }
    if (!isNumber(quantity)) {
      console.log("数量：不是数字类型数据")
      return
    }
    // 获得上一轮我的报价
    // 相等则不提交
    if (isNumber(myQuotePrice) && Number(myQuotePrice) === Number(currentLowestPrice)) {
      insertMessageBox(`上一轮报价(元)：${myQuotePrice}，当前最低价(元)：${currentLowestPrice}, 终止提交`)
      return
    }
    if (userDefineInfo.lowestPrice && !isNumber(userDefineInfo.lowestPrice)) {
      console.log("用户配置的降价倍数：不是数字类型数据")
      return
    }

    currentLowestPrice = Number(currentLowestPrice)
    startPrice = Number(startPrice)
    quantity = Number(quantity)
    userDefineInfo.priceDiffBase = Number(userDefineInfo.priceDiffBase)

    // 根据当前最低价设置降价倍数
    console.log(currentLowestPrice, startPrice, quantity, discountMultipleInput, userDefineInfo.priceDiffBase)

    if (currentLowestPrice && startPrice && quantity && discountMultipleInput && userDefineInfo.priceDiffBase) {
      console.log(userDefineInfo.priceDiffBase, Number(userDefineInfo.priceDiffBase))
      // 获得降价倍数
      let discountMultiple = Number(startPrice - (currentLowestPrice / quantity)) + Number(userDefineInfo.priceDiffBase)
      // 修改输入框的值
      discountMultipleInput.value = discountMultiple;
      // 手动触发input事件
      discountMultipleInput.dispatchEvent(new Event('input'));
      // 手动触发change事件
      discountMultipleInput.dispatchEvent(new Event('change'));

      console.log('根据新的最低价计算降价倍数：', discountMultiple)

      // 拍下的价格
      let targetPrice = startPrice - discountMultiple
      // 如果设置了最低价 且当前起拍价减去 降价倍数 低于最低价则终止操作
      if (userDefineInfo.lowestPrice && targetPrice < userDefineInfo.lowestPrice) {
        insertMessageBox(`降价倍数为${discountMultiple}，提交价格为${targetPrice}，低于插件设置的最低价${userDefineInfo.lowestPrice}, 终止提交`)
        return
      }

      // 触发报价按钮
      let footer = targetDialog.querySelector('.el-dialog__footer');
      let myBtn = footer.querySelector('.myBtn');
      myBtn.click()

      // 最后的弹框确认
      setTimeout(() => {
        let wrapper = document.querySelector(".el-message-box__wrapper")
        if (wrapper) {
          let lastConfirmBtn = wrapper.querySelector(".el-button.el-button--primary")
          if (lastConfirmBtn) {
            lastConfirmBtn.click()
          }
        }
      }, 300)

      return true
    }
  }
}

/**
 * 启动按钮的插入相关
 */
function insertStartBtn (cell, button) {
  // 创建过滤按钮
  const filterBtn = document.createElement('button');
  filterBtn.className = 'hr-filter-btn';
  filterBtn.textContent = '启动';
  // 将按钮插入到清空筛选按钮的旁边
  cell.appendChild(filterBtn, cell);
  // 设置父元素宽度 以展示被挤压的报价历史
  // button.parentNode.style.width = '200px'

  // 添加点击事件
  filterBtn.addEventListener('click', function () {
    // 触发报价按钮点击 弹出报价窗口
    button.click()
    recordStartBtn = button
    // 进行后续的弹窗内部操作
    // setTimeout(() => {
    //   submitQuote()
    // }, 1000)
    // 11 秒后
    setTimeout(() => {
      recordStartBtn = null
      running = false
      closePriceDialog()
    }, 12000)
  });
}

// 插入启动按钮初始化
function insertInit () {
  // 如果按钮已存在，则不重复创建
  if (document.querySelector('.hr-filter-btn')) {
    return true;
  }

  // 获取页面上所有的按钮元素
  const container = document.querySelector('.ccui-app-container-detail2')
  const groupTitle = container.querySelector(".group-title")
  // 寻找竞价大厅
  if (!container && groupTitle.textContent !== "竞价大厅") {
    return
  }

  let tableWrapper = container.querySelector('.el-table__body-wrapper')
  let table = tableWrapper.querySelector('table')

  const rows = table.rows;
  Array.from(rows).forEach(row => {
    const fourthColumnCell = row.cells[3];
    if (fourthColumnCell) {
      // 插入位置
      // 插入行对应的报价按钮
      insertStartBtn(fourthColumnCell.firstChild, row.querySelector('button'))
    }
  })

  return true;
}
// 等待出现目标逻辑
function tryInsertButton () {
  // 监听页面变化（因为可能使用了动态加载）
  const observer = new MutationObserver(function (mutations) {
    // 检查是否需要重新插入按钮
    if (document.querySelector('.ccui-app-container-detail2')) {
      insertInit();
    }

    // 监听弹出框被关闭则不在运行范围
    let targetDialog = getPriceDialog()
    if (!targetDialog && recordStartBtn) {
      recordStartBtn.click()
    }
  });

  // 开始观察页面变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
// 启动按钮的插入相关


function insertMessageBox (msg) {
  // 创建消息框元素
  const messageBox = document.createElement('div');
  messageBox.id = 'custom-message-box';
  messageBox.innerHTML = `
      <p>${msg}</p>
  `;
  // 将消息框添加到页面
  document.body.appendChild(messageBox);
  setTimeout(() => {
    messageBox.remove()
  }, 5000)
}

// 监听页面加载
function init () {
  console.log('柴油发动机助手已加载');

  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInsertButton);
  } else {
    tryInsertButton();
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.userDefineInfo) {
      console.log(request.userDefineInfo)
      userDefineInfo = request.userDefineInfo
    }
  });

  // 从 storage 中获取之前的设置
  chrome.storage.local.get(['userDefineInfo'], function (result) {
    if (result.userDefineInfo) {
      userDefineInfo = result.userDefineInfo
    } else {
      // 保存设置到 storage
      chrome.storage.local.set({
        userDefineInfo: userDefineInfo
      });
    }
  });
}

// 初始化
init();
