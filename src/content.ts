// content.js
import wallet from "~utils/wallet";

export const config = {
  matches: ["https://example.com/*"],
  all_frames: true,
};

// 创建 EthereumProvider
class ChromeEthereumProvider {
  chainId: string = "0x1";
  selectedAddress: string | null = null;
  isConnected: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
    this.initializeChainId();
  }

  private async initializeChainId() {
    try {
      const response = await this.sendMessage({ method: "eth_chainId" });
      if (response.success) {
        this.chainId = response.result;
      }
    } catch (error) {
      console.error("Failed to initialize chain ID:", error);
    }
  }

  async request({ method, params }: { method: string; params?: any[] }) {
    switch (method) {
      case "wallet_switchEthereumChain":
        return this.switchEthereumChain(params);

      case "eth_chainId":
        return this.chainId;

      case "eth_accounts":
        const response = await this.sendMessage({ method, params });
        return response.success ? response.result : [];

      case "eth_requestAccounts":
        // 这里应该实现连接钱包的逻辑
        // throw new Error("eth_requestAccounts not implemented");
        return wallet.accounts;
      case "wallet_addEthereumChain":
        return wallet.addChain(params[0]);

      default:
        throw new Error(`Method ${method} not supported`);
    }
  }

  private async switchEthereumChain(params: any[]) {
    wallet.notifyNetworkChanged(params[0].chainId);
    // if (!params || !params[0] || !params[0].chainId) {
    //   throw {
    //     code: -32602,
    //     message: "Invalid params",
    //   };
    // }

    // const response = await this.sendMessage({
    //   method: "wallet_switchEthereumChain",
    //   params: params,
    // });

    // if (!response.success) {
    //   throw response.error;
    // }

    // return response.result;
  }

  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: {
              code: -32603,
              message: chrome.runtime.lastError.message,
            },
          });
        } else {
          resolve(response);
        }
      });
    });
  }

  private setupEventListeners() {
    // 监听来自 background 的链更改事件
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "chainChanged") {
        const previousChainId = this.chainId;
        this.chainId = message.chainId;

        // 触发 chainChanged 事件
        this.emit("chainChanged", message.chainId);

        // 如果链发生变化，也触发 accountsChanged 事件（按照标准）
        if (previousChainId !== message.chainId) {
          this.emit(
            "accountsChanged",
            this.selectedAddress ? [this.selectedAddress] : []
          );
        }
      }

      // 处理账户变更
      if (message.type === "accountsChanged") {
        this.selectedAddress = message.accounts?.[0] || null;
        this.emit("accountsChanged", message.accounts || []);
      }

      // 处理连接状态变更
      if (message.type === "connect") {
        this.isConnected = true;
        this.emit("connect", { chainId: this.chainId });
      }

      if (message.type === "disconnect") {
        this.isConnected = false;
        this.selectedAddress = null;
        this.emit("disconnect");
      }
    });
  }

  private emit(event: string, data: any = {}) {
    // 触发注册的事件监听器
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    });

    // 同时触发原生事件供兼容性使用
    window.dispatchEvent(
      new CustomEvent(`ethereum.${event}`, { detail: data })
    );
  }

  // 添加事件监听器
  on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    return this;
  }

  // 移除事件监听器
  removeListener(event: string, callback: (data: any) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  // 移除所有事件监听器
  removeAllListeners(event?: string) {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
    return this;
  }
}

// 注入到页面（需要在 document_start 时执行）
const provider = new ChromeEthereumProvider();

// 将 provider 注入到 window.ethereum
Object.defineProperty(window, "myWallet", {
  value: provider,
  writable: false,
  configurable: false,
});

// 触发 ethereum#initialized 事件
window.dispatchEvent(new Event("ethereum#initialized"));

// 确保在 DOMContentLoaded 后也能访问
document.addEventListener("DOMContentLoaded", () => {
  if (!window.myWallet) {
    Object.defineProperty(window, "myWallet", {
      value: provider,
      writable: false,
      configurable: false,
    });
  }
});

console.log("Content script loaded");
