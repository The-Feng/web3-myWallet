import { sepolia, mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";
import { PLASMO_PUBLIC_INFURA_ID } from "~utils/const"

export const chains = new Map();

// 初始化默认链
chains.set(
  sepolia.id,
  createPublicClient({
    chain: sepolia,
    transport: http(
      `https://sepolia.infura.io/v3/${PLASMO_PUBLIC_INFURA_ID}`
    ),
  })
);

chains.set(
  mainnet.id,
  createPublicClient({
    chain: mainnet,
    transport: http(
      `https://mainnet.infura.io/v3/${PLASMO_PUBLIC_INFURA_ID}`
    ),
  })
);

// 添加新链的函数
export async function addChain(chainConfig: any) {
  try {
    // 创建新的链客户端
    const client = createPublicClient({
      chain: chainConfig,
      transport: http(chainConfig.rpcUrls.default.http[0]),
    });
    
    // 存储到链映射中
    chains.set(chainConfig.id, client);
    
    return client;
  } catch (error) {
    console.error("添加链失败:", error);
    throw error;
  }
}

// 获取链客户端
export function getChainClient(chainId: number) {
  return chains.get(chainId);
}