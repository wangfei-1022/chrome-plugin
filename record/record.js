// 监听到是否报错 后重新提交报价
// 报错获取到最低价继续提交
//   let errorContainer = document.querySelector('.el-message.el-message--error')

// if (errorContainer) {
//   let contentContainer = errorContainer.querySelector('.el-message__content')
//   if(contentContainer) {
//     if (userDefineInfo.retryOnFailure === 1) {
//       // "报价明细车用柴油 0的当前报价不是最低报价，报价应小于最低价5392500.00!!!"
//       let str = contentContainer.textContent
//       let arr = str.split("报价应小于最低价")
//       if (arr[1]) {
//         let currentLowestPriceError = arr[1].replace(/！/g, "")
//         if(isNumber(currentLowestPriceError)) {
//           submitQuote(currentLowestPriceError);
//         }
//       }
//     }
//   }
//   }


  // if (xhrItem.url === 'https://crma.iccec.cn/apis/crma/bid/bidc/dealSupBiddingHallQuoteMat') {
  //   let res = JSON.parse(xhrItem.response)
  //   if (userDefineInfo.retryOnFailure === 1) {
  //     // "报价明细车用柴油 0的当前报价不是最低报价，报价应小于最低价5392500.00!!!"
  //     let str = res.message
  //     let arr = str.split("报价应小于最低价")
  //     if (arr[1]) {
  //       let currentLowestPriceError = arr[1].replace(/！/g, "")
  //       if (isNumber(currentLowestPriceError)) {
  //         console.log(currentLowestPriceError)
  //         submitQuote(currentLowestPriceError);
  //       }
  //     }
  //   }
  // }


  // const allButtons = container.querySelectorAll('button');
  // 用于存储文本为“报价”的按钮的数组
  // const quoteButtons = [];

  // 遍历所有按钮
  // allButtons.forEach(button => {
  //   // 去除按钮文本前后的空白字符并检查是否为“报价”
  //   if (button.textContent.trim() === '报价') {
  //     quoteButtons.push(button);
  //   }
  // });

  // 输出找到的按钮
  // console.log(quoteButtons);
  
  // quoteButtons.forEach(button => {
  // insertStartBtn(button)
  // })