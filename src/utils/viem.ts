import { sepolia, mainnet } from "viem/chains";
import { createPublicClient, http } from "viem";
// require("dotenv").config();
export const chains = new Map();
chains.set(
  sepolia.id,
  createPublicClient({
    chain: sepolia,
    transport: http(
      `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`
    ),
  })
);
chains.set(
  mainnet.id,
  createPublicClient({
    chain: mainnet,
    transport: http(
      `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`
    ),
  })
);

export const viemClients = (chainId: number) => {
  return chains.get(chainId);
};
