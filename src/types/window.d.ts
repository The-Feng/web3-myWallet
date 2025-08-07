// 扩展Window接口以添加myWallet属性
import type { WalletCore } from "~utils/wallet";

declare global {
  interface Window {
    myWallet: WalletCore;
  }
}

export {};