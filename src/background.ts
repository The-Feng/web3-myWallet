import wallet from "~utils/wallet";

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 检查发送者是否有效
  if (!sender || !sender.tab) {
    console.warn("Invalid sender:", sender);
    return false;
  }

  try {
    if (request.method === "eth_requestAccounts") {
      // 获取用户账户
      const accounts = getUserAccounts();
      sendResponse({ result: accounts });
      return true; // 保持消息通道开放
    }

    if (request.method === "wallet_switchEthereumChain") {
      wallet.notifyNetworkChanged(request.params);
      return true; // 异步响应
    }

    // 对于未处理的消息类型，返回false表示我们不会发送响应
    return false;
  } catch (error) {
    console.error("处理消息时发生错误:", error);
    // 发送错误响应
    sendResponse({ error: error.message });
    return true;
  }
});

function getUserAccounts() {
  // 返回钱包账户，如果钱包未解锁则返回空数组
  try {
    if (wallet && Array.isArray(wallet.accounts)) {
      return wallet.accounts.map((account) => account.address);
    }
    return [];
  } catch (error) {
    console.error("获取账户时出错:", error);
    return [];
  }
}

// 处理扩展安装或更新
chrome.runtime.onInstalled.addListener((details) => {
  console.log("扩展已安装或更新:", details.reason);
});

// 处理扩展启动
chrome.runtime.onStartup.addListener(() => {
  console.log("扩展已启动");
});
