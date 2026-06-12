console.log('Background service worker running!');

// 监听来自内容脚本或其他组件的日志消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === 'log') {
    logQueue.addLog(message.data, sender);
    // 这里可以进一步处理接收到的请求信息，比如存储、分析等
    sendResponse({ status: 'ok' });
    return true;
  } else if (message.source === 'popup') {
    // 解构消息：action 为方法名，args 为参数数组
    const { action, args = [] } = message;

    // 验证方法是否存在
    if (typeof self[action] !== 'function') {
      sendResponse({
        success: false,
        error: `Method "${action}" not found in background`
      });
      return;
    }

    try {
      // 执行方法
      const result = self[action](...args);
      // 处理异步方法（返回 Promise）
      if (result instanceof Promise) {
        result.then(data => {
          sendResponse({ success: true, data });
        }).catch(error => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        });
        return true; // 保持消息通道打开，等待异步操作完成
      }
      // 处理同步方法
      sendResponse({ success: true, data: result });
    } catch (error) {
      // 捕获同步方法的异常
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    // 这里可以进一步处理接收到的请求信息，比如存储、分析等
    sendResponse({ status: 'ok' });
    return true;
  }
});

// 使用IndexedDB存储日志
let db;

// 初始化数据库
function initDatabase () {
  const request = indexedDB.open('extensionLogs', 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });

    // 创建索引（可选）
    objectStore.createIndex('date', 'date', { unique: false });
    objectStore.createIndex('pluginName', 'pluginName', { unique: false });
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log('IndexedDB初始化成功');
    console.log(db)
    logQueue.run()
  };

  request.onerror = (event) => {
    console.error('IndexedDB初始化失败:', event.target.error);
  };
}

// 添加日志到IndexedDB
function addLogToDatabase (logEntry) {
  return new Promise((resolve, reject) => {
    if (db) {
      const transaction = db.transaction(['logs'], 'readwrite');
      const objectStore = transaction.objectStore('logs');
      const request = objectStore.add(logEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } else {
      reject("DB 未初始化完成")
    }
  });
}

function deleteLogs () {
  const request = indexedDB.open('extensionLogs', 1);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['logs'], 'readwrite');
    const objectStore = transaction.objectStore('logs');
    objectStore.clear();
  };
}

// 从IndexedDB导出日志为文件
function exportLogs (targetDate) {
  function createFile (content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const reader = new FileReader();
    reader.onloadend = function () {
      const dataUrl = reader.result;
      chrome.downloads.download({
        url: dataUrl,
        filename: fileName,
        saveAs: false
      }, downloadId => {
        if (chrome.runtime.lastError) {
          console.error('下载日志文件失败:', chrome.runtime.lastError);
        } else {
          console.log('日志文件已保存，下载ID:', downloadId);
        }
      });
    };
    reader.readAsDataURL(blob);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['logs'], 'readonly');
    const objectStore = transaction.objectStore('logs');
    if (!targetDate) {
      const LOG_FILE_NAME = 'log.txt';
      const request = objectStore.getAll();
      request.onsuccess = () => {
        const logs = request.result;
        const logText = logs.map(entry =>
          `${entry.dateTime}  [${entry.operType}]   [${entry.pluginName}]   ${JSON.stringify(entry)}}`
        ).join('\n');
        createFile(logText, LOG_FILE_NAME)
        resolve();
      };
      request.onerror = () => reject(request.error);
    } else {
      const LOG_FILE_NAME = `${targetDate}.txt`;
      const index = objectStore.index('date');
      const request = index.openCursor(IDBKeyRange.only(targetDate));

      let logs = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          const logText = logs.map(entry =>
            `${entry.dateTime}   [${entry.operType}]   [${entry.pluginName}]   ${JSON.stringify(entry)}`
          ).join('\n');
          createFile(logText, LOG_FILE_NAME)
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    }
  });
}

function getAllDates () {
  console.log('getAllDates')
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['logs'], 'readonly');
    const index = transaction.objectStore('logs').index('date');
    const dates = new Set(); // 使用Set自动去重

    // 使用游标遍历所有日期索引
    const cursorRequest = index.openKeyCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        // 提取日期部分（忽略时间）
        const datePart = new Date(cursor.key).toISOString().split('T')[0];
        dates.add(datePart);
        cursor.continue();
      } else {
        // 遍历完成，返回结果
        resolve(Array.from(dates));
        // db.close();
      }
    };

    cursorRequest.onerror = () => {
      reject(cursorRequest.error);
      // db.close();
    };
  });
}

initDatabase()

// 增加日志执行队列
let logQueue = {
  queue: [],
  running: false,
  addLog (log) {
    console.log(log)
    this.queue.push(log);
    if (!this.running) {
      this.run();
    }
  },
  run () {
    if (this.running || this.queue.length === 0) {
      return;
    }
    this.running = true;
    const log = this.queue.shift();
    addLogToDatabase(log).then(() => {
      this.running = false;
      this.run();
    }, (err) => {
      this.running = false;
      this.run();
      console.log('日志记录错误', log, err)
    })
  }
}
