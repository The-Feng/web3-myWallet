import React, { useEffect, useState } from 'react'
import wallet, { type Token } from '~utils/wallet'
import { TokenIcon } from '@web3icons/react'
import { getBalance } from "~utils/ethers"
import { formatUnits } from "ethers"
import { Modal } from 'antd-mobile'
import { DeleteOutline } from 'antd-mobile-icons'

// 定义原生代币的特殊地址标识
const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function Tokens(props: {
  asset: Token,
  currentChain: any,
}) {
  const { asset, currentChain } = props
  const [balance, setBalance] = useState("0")

  const fetchBalance = async () => {
    // 添加参数验证
    if (!asset || !currentChain) {
      console.log("Missing asset or chainId", { asset, chainId: currentChain });
      return;
    }

    try {
      const accountAddress = wallet.getCurrentAccountAddress();
      if (!accountAddress) {
        console.log("No account selected");
        return;
      }

      let value;
      // 检查是否为原生代币（ETH等）
      if (asset.address === NATIVE_TOKEN_ADDRESS || !asset.address) {
        // 对于原生代币，使用账户地址查询余额
        value = await getBalance(accountAddress, currentChain)
      } else {
        // 对于ERC-20代币，使用代币地址查询余额（如果ethers.js支持的话）
        // 或者应该使用合约方法查询代币余额
        value = await getBalance(accountAddress, currentChain, asset.address)
      }
      setBalance(formatUnits(value, asset.decimals))
    } catch (err) {
      console.log("Error fetching balance", err);
      setBalance("0");
    }
  }

  const handleDeleteToken = () => {
    Modal.confirm({
      title: '删除代币',
      content: `确定要删除代币 ${asset.name} (${asset.symbol}) 吗？`,
      onConfirm: async () => {
        try {
          const result = await wallet.removeToken(asset.address, asset.chainId);
          if (result.success) {
            console.log(`代币 ${asset.name} 已删除`);
          } else {
            console.error('删除代币失败:', result.error);
          }
        } catch (error) {
          console.error('删除代币时发生错误:', error);
        }
      }
    });
  };

  useEffect(() => {
    fetchBalance()
  }, [asset])

  return (
    <div key={asset.address} className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg mr-3">
            <TokenIcon symbol={(asset.symbol as string).toLocaleLowerCase()} />
          </div>
          <div>
            <div className="font-medium text-gray-900">{asset.name}</div>
            <div className="text-sm text-gray-500">{asset.symbol}</div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="text-right mr-2">
            <div className="font-medium text-gray-900">{
              parseFloat(balance).toFixed(7)
            }</div>
          </div>
          {/* 只对自定义代币显示删除按钮，原生代币不显示 */}
          {asset.address && asset.address !== NATIVE_TOKEN_ADDRESS && (
            <DeleteOutline
              className="text-gray-400 hover:text-red-500 cursor-pointer"
              onClick={handleDeleteToken}
              fontSize={18}
            />
          )}
        </div>
      </div>
    </div>
  )
}