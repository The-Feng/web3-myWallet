import { JsonRpcProvider } from "ethers";
import { PLASMO_PUBLIC_INFURA_ID } from "~utils/const";
import { type PublicClient } from "viem";
import { Contract } from "ethers";
// ERC20 转账 ABI
export const erc20Abi = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (number)",
];

export const getBalance = async (
  accountAddress: string,
  chain: PublicClient,
  tokenAddress?: string
) => {
  const chainName =
    chain.chain.id === 1 ? "mainnet" : chain.chain.name.toLocaleLowerCase();
  const infura = `https://${chainName}.infura.io/v3/${PLASMO_PUBLIC_INFURA_ID}`;
  const provider = new JsonRpcProvider(infura);
  let balance;
  if (tokenAddress) {
    const contract = new Contract(tokenAddress, erc20Abi, provider);
    balance = await contract.balanceOf(accountAddress);
    console.log("token balance", balance);
  } else {
    balance = await provider.getBalance(accountAddress);
    console.log("native balance", balance);
  }

  return balance;
};

export const getContranct = (address: string, currentChain: PublicClient) => {
  const chainName =
    currentChain.chain.id === 1
      ? "mainnet"
      : currentChain.chain.name.toLocaleLowerCase();
  const infura = `https://${chainName}.infura.io/v3/${PLASMO_PUBLIC_INFURA_ID}`;
  const provider = new JsonRpcProvider(infura);

  // erc20 合约
  const contract = new Contract(address, erc20Abi, provider);
  return contract;
};
