const bip39 = require("bip39");
import { mainnet } from "viem/chains";
import { HDNodeWallet, Mnemonic } from "ethers";
import { type PublicClient } from "viem";

// 定义代币接口
export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
  chainId: number; // 添加链ID以支持不同链的代币
}

export class WalletCore {
  accounts: any[];
  selectedAccount: any;
  isLocked: boolean;
  password: string | null;
  seedPhrase: string | null;
  currentNetwork: string;
  initialized: boolean;
  currentChainId: number;
  // 修改代币列表属性，使用Map按链ID存储代币
  tokens: Map<number, Token[]>;
  customChains: any[];

  constructor() {
    this.accounts = [];
    this.selectedAccount = null;
    this.isLocked = true;
    this.password = null;
    this.seedPhrase = null;
    this.currentNetwork = "mainnet";
    this.initialized = false;
    this.currentChainId = mainnet.id;
    this.tokens = new Map<number, Token[]>(); // 初始化为Map
    this.customChains = []; // 初始化自定义链列表
  }

  // 初始化钱包
  async initialize() {
    try {
      // 从存储中恢复状态
      const storedData = await this.getStoredData();

      if (storedData) {
        this.accounts = storedData.accounts || [];
        this.selectedAccount = storedData.selectedAccount || null;
        this.currentNetwork = storedData.currentNetwork || "mainnet";
        this.initialized = storedData.initialized || false;
        this.isLocked = storedData.isLocked !== false; // 默认锁定

        // 初始化代币数据，从存储格式转换为Map格式
        this.tokens = new Map<number, Token[]>();
        if (storedData.tokens) {
          // 如果存储的数据是对象格式
          if (
            typeof storedData.tokens === "object" &&
            !Array.isArray(storedData.tokens)
          ) {
            Object.keys(storedData.tokens).forEach((chainId) => {
              this.tokens.set(Number(chainId), storedData.tokens[chainId]);
            });
          }
        }
        
        // 初始化自定义链数据
        if (storedData.customChains) {
          this.customChains = storedData.customChains;
        } else {
          // 设置默认的自定义链列表
          this.customChains = [
            {
              id: 1,
              name: "Ethereum Mainnet",
              network: "ethereum",
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: {
                default: { http: ["https://mainnet.infura.io/v3"] }
              }
            }
          ];
        }
      }

      return {
        hasAccounts: this.accounts.length > 0,
        isInitialized: this.initialized,
        isLocked: this.isLocked,
        selectedAccount: this.selectedAccount,
      };
    } catch (error) {
      console.error("钱包初始化失败:", error);
      return { hasAccounts: false, isInitialized: false, isLocked: true };
    }
  }

  // 检查是否有账户
  hasAccounts() {
    return this.accounts && this.accounts.length > 0;
  }

  // 检查是否有活跃账户
  hasActiveAccount() {
    return (
      this.selectedAccount &&
      this.accounts.some((acc) => acc.address === this.selectedAccount)
    );
  }

  // 获取当前账户状态
  getAccountStatus() {
    return {
      hasAccounts: this.hasAccounts(),
      hasActiveAccount: this.hasActiveAccount(),
      isLocked: this.isLocked,
      isInitialized: this.initialized,
      selectedAccount: this.selectedAccount,
      accountCount: this.accounts.length,
      accounts: this.isLocked ? [] : this.accounts,
    };
  }

  // 创建新钱包
  async createWallet(password, seedPhrase = null) {
    try {
      // 生成或使用提供的助记词
      const mnemonic = seedPhrase || this.generateSeedPhrase();

      // 从助记词生成第一个账户
      const firstAccount = await this.deriveAccountFromSeed(mnemonic, 0);

      // 加密存储
      const encryptedData = await this.encryptWalletData(
        {
          seedPhrase: mnemonic,
          accounts: [firstAccount],
          selectedAccount: firstAccount.address,
          currentNetwork: this.currentNetwork,
        },
        password
      );

      // 更新内存状态
      this.accounts = [firstAccount];
      this.selectedAccount = firstAccount.address;
      this.isLocked = false;
      this.initialized = true;
      this.password = password;
      this.seedPhrase = mnemonic;

      // 保存到存储
      await this.saveWalletData(encryptedData);

      return {
        success: true,
        account: firstAccount,
        seedPhrase: mnemonic,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 解锁钱包
  async unlock(password) {
    try {
      const storedData = await this.getStoredData();
      if (!storedData || !storedData.encryptedWallet) {
        return { success: false, error: "钱包未初始化" };
      }

      // 解密钱包数据
      const decryptedData = await this.decryptWalletData(
        storedData.encryptedWallet,
        password
      );

      // 更新内存状态
      this.accounts = decryptedData.accounts || [];
      this.selectedAccount = decryptedData.selectedAccount || null;
      this.currentNetwork = decryptedData.currentNetwork || "mainnet";
      this.seedPhrase = decryptedData.seedPhrase;
      this.password = password;
      this.isLocked = false;

      // 更新存储状态
      await this.updateStoredData({ isLocked: false });

      return {
        success: true,
        accounts: this.accounts,
        selectedAccount: this.selectedAccount,
      };
    } catch (error) {
      return { success: false, error: "密码错误或解密失败" };
    }
  }

  // 锁定钱包
  async lock() {
    this.isLocked = true;
    this.password = null;
    this.seedPhrase = null;

    await this.updateStoredData({ isLocked: true });

    // 通知所有连接的页面
    this.notifyAccountsChanged([]);
  }

  // 添加新账户
  async addAccount() {
    if (this.isLocked || !this.seedPhrase) {
      return { success: false, error: "钱包已锁定" };
    }

    try {
      const accountIndex = this.accounts.length;
      const newAccount = await this.deriveAccountFromSeed(
        this.seedPhrase,
        accountIndex
      );

      this.accounts.push(newAccount);

      // 重新加密并保存
      const encryptedData = await this.encryptWalletData(
        {
          seedPhrase: this.seedPhrase,
          accounts: this.accounts,
          selectedAccount: this.selectedAccount,
          currentNetwork: this.currentNetwork,
        },
        this.password
      );

      await this.saveWalletData(encryptedData);

      return { success: true, account: newAccount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 切换账户
  async switchAccount(address) {
    const account = this.accounts.find((acc) => acc.address === address);
    if (!account) {
      return { success: false, error: "账户不存在" };
    }

    this.selectedAccount = address;
    await this.updateStoredData({ selectedAccount: address });

    // 通知页面账户变更
    this.notifyAccountsChanged([address]);

    return { success: true, account };
  }

  // 断开连接
  async disconnect() {
    // 重置选中账户但不解锁钱包
    this.selectedAccount = null;

    // 更新存储状态
    await this.updateStoredData({ selectedAccount: null });

    // 通知所有连接的页面账户已断开
    this.notifyAccountsChanged([]);

    return { success: true };
  }

  // 获取连接的账户（供页面调用）
  getConnectedAccounts() {
    if (this.isLocked || !this.hasActiveAccount()) {
      return [];
    }
    return [this.selectedAccount];
  }

  // ==================== 加密相关方法 ====================

  // 生成助记词
  generateSeedPhrase() {
    return bip39.generateMnemonic();
    // // 实际实现中应使用 bip39 库
    // const words = [
    //   "abandon",
    //   "ability",
    //   "able",
    //   "about",
    //   "above",
    //   "absent",
    //   "absorb",
    //   "abstract",
    //   "absurd",
    //   "abuse",
    //   "access",
    //   "accident",
    //   "account",
    //   "accuse",
    //   "achieve",
    //   "acid",
    //   // ... 完整的 2048 词汇表
    // ];

    // const mnemonic = [];
    // for (let i = 0; i < 12; i++) {
    //   mnemonic.push(words[Math.floor(Math.random() * words.length)]);
    // }
    // return mnemonic.join(" ");
  }

  // 从助记词派生账户
  async deriveAccountFromSeed(seedPhrase, index) {
    try {
      // 使用ethers从助记词创建HD钱包
      const mnemonic = Mnemonic.fromPhrase(seedPhrase);
      const hdNode = HDNodeWallet.fromMnemonic(
        mnemonic,
        `m/44'/60'/0'/0/${index}`
      );

      return {
        address: hdNode.address,
        privateKey: hdNode.privateKey,
        publicKey: hdNode.publicKey,
        index: index,
        name: `Account ${index + 1}`,
        balance: "0",
      };
    } catch (error) {
      console.error("从助记词派生账户失败:", error);
      throw new Error("无效的助记词或派生路径");
    }
  }

  // 加密钱包数据
  async encryptWalletData(data, password) {
    // 实际实现中应使用 crypto-js 或类似库进行 AES 加密
    const jsonString = JSON.stringify(data);
    const encrypted = btoa(jsonString + password); // 简化示例
    return encrypted;
  }

  // 解密钱包数据
  async decryptWalletData(encryptedData, password) {
    try {
      const decoded = atob(encryptedData);
      const jsonString = decoded.replace(password, "");
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error("解密失败");
    }
  }

  // ==================== 代币管理方法 ====================

  // 添加代币
  async addToken(token: Token) {
    // 获取指定链的代币列表
    let chainTokens = this.tokens.get(token.chainId);
    if (!chainTokens) {
      chainTokens = [];
      this.tokens.set(token.chainId, chainTokens);
    }

    // 检查代币是否已存在
    const existingToken = chainTokens.find(
      (t) => t.address.toLowerCase() === token.address.toLowerCase()
    );

    if (existingToken) {
      return { success: false, error: "代币已存在" };
    }

    // 添加代币到列表
    chainTokens.push(token);

    // 更新存储
    await this.updateStoredData({ tokens: this.tokensToObject() });

    return { success: true, token };
  }

  // 获取指定链的代币列表
  getTokens(chainId?: number) {
    if (chainId !== undefined) {
      return this.tokens.get(chainId) || [];
    }
    // 如果未指定链，则返回当前链的代币
    return this.tokens.get(this.currentChainId) || [];
  }

  // 根据地址和链ID获取特定代币
  getTokenByAddress(address: string, chainId?: number) {
    const targetChainId = chainId !== undefined ? chainId : this.currentChainId;
    const chainTokens = this.tokens.get(targetChainId);

    if (!chainTokens) {
      return undefined;
    }

    return chainTokens.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );
  }

  // 删除代币
  async removeToken(address: string, chainId?: number) {
    const targetChainId = chainId !== undefined ? chainId : this.currentChainId;
    const chainTokens = this.tokens.get(targetChainId);

    if (!chainTokens) {
      return { success: false, error: "代币不存在" };
    }

    const tokenIndex = chainTokens.findIndex(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );

    if (tokenIndex === -1) {
      return { success: false, error: "代币不存在" };
    }

    // 从列表中移除代币
    const removedToken = chainTokens.splice(tokenIndex, 1)[0];

    // 更新存储
    await this.updateStoredData({ tokens: this.tokensToObject() });

    return { success: true, token: removedToken };
  }

  // 更新代币余额
  async updateTokenBalance(address: string, balance: string, chainId?: number) {
    const targetChainId = chainId !== undefined ? chainId : this.currentChainId;
    const chainTokens = this.tokens.get(targetChainId);

    if (!chainTokens) {
      return { success: false, error: "代币不存在" };
    }

    const token = chainTokens.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );

    if (!token) {
      return { success: false, error: "代币不存在" };
    }

    // 确保balance是string类型
    token.balance = typeof balance === "bigint" ? String(balance) : balance;

    // 更新存储
    await this.updateStoredData({ tokens: this.tokensToObject() });

    return { success: true, token };
  }

  // 将Map格式的代币数据转换为可存储的对象格式
  private tokensToObject() {
    const obj: { [key: number]: Token[] } = {};
    this.tokens.forEach((tokens, chainId) => {
      obj[chainId] = tokens;
    });
    return obj;
  }

  // ==================== 存储相关方法 ====================

  async getStoredData() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      // 浏览器插件环境
      return new Promise((resolve) => {
        chrome.storage.local.get(["walletData"], (result) => {
          resolve(result.walletData || null);
        });
      });
    } else {
      // 测试环境
      const data = localStorage.getItem("walletData");
      if (data) {
        try {
          return JSON.parse(data);
        } catch (error) {
          console.error("解析存储数据失败:", error);
          return null;
        }
      }
      return null;
    }
  }

  async saveWalletData(encryptedData) {
    const dataToSave = {
      encryptedWallet: encryptedData,
      initialized: true,
      isLocked: this.isLocked,
      selectedAccount: this.selectedAccount,
      currentNetwork: this.currentNetwork,
      tokens: this.tokensToObject(), // 使用转换后对象格式存储
      accounts: this.isLocked
        ? []
        : this.accounts.map((acc) => ({
            address: acc.address,
            name: acc.name,
            index: acc.index,
          })),
    };

    // 自定义序列化函数，处理BigInt类型
    const jsonStringify = (obj) => {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      });
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      // Chrome storage可以直接存储对象，不需要序列化
      return new Promise((resolve) => {
        chrome.storage.local.set({ walletData: dataToSave }, () => resolve);
      });
    } else {
      // LocalStorage需要序列化，使用自定义序列化函数
      localStorage.setItem("walletData", jsonStringify(dataToSave));
    }
  }

  async updateStoredData(updates) {
    const currentData = (await this.getStoredData()) || {};
    const updatedData = { ...currentData, ...updates };

    // 自定义序列化函数，处理BigInt类型
    const jsonStringify = (obj) => {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      });
    };

    if (typeof chrome !== "undefined" && chrome.storage) {
      // Chrome storage可以直接存储对象，不需要序列化
      return new Promise((resolve) => {
        chrome.storage.local.set({ walletData: updatedData }, () => resolve);
      });
    } else {
      // LocalStorage需要序列化，使用自定义序列化函数
      localStorage.setItem("walletData", jsonStringify(updatedData));
    }
  }

  // ==================== 页面通信方法 ====================

  // 通知账户变更
  notifyAccountsChanged(accounts) {
    // 向所有标签页发送消息
    if (typeof chrome !== "undefined" && chrome.tabs) {
      try {
        chrome.tabs.query({}, (tabs) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "Chrome runtime error when querying tabs:",
              chrome.runtime.lastError.message
            );
            return;
          }

          tabs.forEach((tab) => {
            if (tab && tab.id) {
              try {
                chrome.tabs
                  .sendMessage(tab.id, {
                    type: "ACCOUNTS_CHANGED",
                    accounts: accounts,
                  })
                  .catch((error) => {
                    // 忽略特定的错误，这些错误可能是由于页面导航或标签页关闭引起的
                    if (
                      error.message &&
                      (error.message.includes(
                        "Could not establish connection"
                      ) ||
                        error.message.includes("Receiving end does not exist"))
                    ) {
                      // 这些是常见的、可预期的错误，可以忽略
                      console.debug(
                        "Expected messaging error (tab may have been closed or navigated away):",
                        error.message
                      );
                    } else {
                      // 记录其他意外错误
                      console.warn(
                        "Unexpected error when sending message to tab:",
                        error
                      );
                    }
                  });
              } catch (sendError) {
                console.warn("Error sending message to tab:", sendError);
              }
            }
          });
        });
      } catch (queryError) {
        console.warn("Error querying tabs:", queryError);
      }
    }

    // 触发自定义事件
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("accountsChanged", {
            detail: { accounts },
          })
        );
      } catch (eventError) {
        console.warn("Error dispatching accountsChanged event:", eventError);
      }
    }
  }

  // 通知网络变更
  notifyNetworkChanged(chainId) {
    this.currentChainId = chainId;

    if (typeof chrome !== "undefined" && chrome.tabs) {
      try {
        chrome.tabs.query({}, (tabs) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "Chrome runtime error when querying tabs:",
              chrome.runtime.lastError.message
            );
            return;
          }

          tabs.forEach((tab) => {
            if (tab && tab.id) {
              try {
                chrome.tabs
                  .sendMessage(tab.id, {
                    type: "CHAIN_CHANGED",
                    chainId: chainId,
                  })
                  .catch((error) => {
                    // 忽略特定的错误，这些错误可能是由于页面导航或标签页关闭引起的
                    if (
                      error.message &&
                      (error.message.includes(
                        "Could not establish connection"
                      ) ||
                        error.message.includes("Receiving end does not exist"))
                    ) {
                      // 这些是常见的、可预期的错误，可以忽略
                      console.debug(
                        "Expected messaging error (tab may have been closed or navigated away):",
                        error.message
                      );
                    } else {
                      // 记录其他意外错误
                      console.warn(
                        "Unexpected error when sending message to tab:",
                        error
                      );
                    }
                  });
              } catch (sendError) {
                console.warn("Error sending message to tab:", sendError);
              }
            }
          });
        });
      } catch (queryError) {
        console.warn("Error querying tabs:", queryError);
      }
    }

    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("chainChanged", {
            detail: { chainId },
          })
        );
      } catch (eventError) {
        console.warn("Error dispatching chainChanged event:", eventError);
      }
    }
  }

  // ==================== EIP-747: wallet_watchAsset 方法 ====================

  /**
   * EIP-747: wallet_watchAsset 实现
   * 用于向钱包添加 token，支持 ERC-20、ERC-721、ERC-1155
   *
   * @param params - 添加资产的参数
   * @returns 添加结果
   */
  async watchAsset(params: {
    type: string;
    options: {
      address: string;
      symbol?: string;
      decimals?: number;
      image?: string;
      tokenId?: string;
    };
  }) {
    try {
      // 验证参数
      if (!params.type) {
        throw new Error("资产类型是必需的");
      }

      if (!params.options || !params.options.address) {
        throw new Error("资产地址是必需的");
      }

      // 支持的资产类型
      const supportedTypes = ["ERC20", "ERC721", "ERC1155"];
      if (!supportedTypes.includes(params.type.toUpperCase())) {
        throw new Error(`不支持的资产类型: ${params.type}`);
      }

      // 创建代币对象
      const token: Token = {
        address: params.options.address,
        name:
          params.options.symbol ||
          `Token-${params.options.address.substring(0, 6)}`,
        symbol: params.options.symbol || `TOKEN`,
        decimals: params.options.decimals || 0,
        logoURI: params.options.image,
        chainId: this.currentChainId, // 使用当前链ID
      };

      // 添加代币到钱包
      const result = await this.addToken(token);

      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || "添加代币失败");
      }
    } catch (error) {
      console.error("watchAsset 错误:", error);
      throw error;
    }
  }

  // 获取当前选中的账户地址
  getCurrentAccountAddress() {
    return this.selectedAccount;
  }

  // 获取当前选中的账户
  getCurrentAccount() {
    if (!this.selectedAccount) return null;
    return this.accounts.find((acc) => acc.address === this.selectedAccount);
  }

  // 获取当前账户的原生代币余额
  async getNativeBalance(chain: PublicClient) {
    const accountAddress = this.getCurrentAccountAddress();
    if (!accountAddress) {
      throw new Error("No account selected");
    }

    // 导入 getBalance 函数
    const { getBalance } = await import("~utils/ethers");
    return await getBalance(accountAddress, chain);
  }
  
  // 添加链到钱包
  async addChain(chainConfig: {
    id: number;
    name: string;
    network: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: {
      default: { http: string[] };
      public?: { http: string[] };
    };
    blockExplorers?: {
      default: { name: string; url: string };
    };
    testnet?: boolean;
  }) {
    try {
      // 导入 createPublicClient 和 http
      const { createPublicClient, http } = await import("viem");
      
      // 创建新的链客户端
      const newChainClient = createPublicClient({
        chain: chainConfig,
        transport: http(chainConfig.rpcUrls.default.http[0])
      });
      
      // 尝试连接以验证配置
      await newChainClient.getBlockNumber();
      
      // 如果成功，添加到存储中
      const storedData = await this.getStoredData();
      let customChains = storedData?.customChains || [];
      
      // 检查链是否已存在
      const existingChainIndex = customChains.findIndex(
        (chain: any) => chain.id === chainConfig.id
      );
      
      if (existingChainIndex >= 0) {
        // 更新现有链配置
        customChains[existingChainIndex] = chainConfig;
      } else {
        // 添加新链
        customChains.push(chainConfig);
      }
      
      // 保存到存储
      await this.updateStoredData({ customChains });
      
      return { success: true, chain: chainConfig };
    } catch (error) {
      console.error("添加链失败:", error);
      return { success: false, error: error.message };
    }
  }
  
  // 获取所有自定义链
  async getCustomChains() {
    const storedData = await this.getStoredData();
    return storedData?.customChains || [];
  }
  
  // 删除自定义链
  async removeCustomChain(chainId: number) {
    try {
      const storedData = await this.getStoredData();
      let customChains = storedData?.customChains || [];
      
      // 过滤掉要删除的链
      customChains = customChains.filter(
        (chain: any) => chain.id !== chainId
      );
      
      // 保存到存储
      await this.updateStoredData({ customChains });
      
      return { success: true };
    } catch (error) {
      console.error("删除链失败:", error);
      return { success: false, error: error.message };
    }
  }
}

const wallet = new WalletCore();
wallet.initialize();

export default wallet;
