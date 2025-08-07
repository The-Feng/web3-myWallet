import React, { useState, useEffect } from 'react'
import { Modal, Toast, Button, Input, Picker, TextArea } from 'antd-mobile'
import { type Token } from "~utils/wallet"
import wallet from "~utils/wallet"
import { JsonRpcProvider, isAddress, Contract, Wallet } from "ethers"
import { PLASMO_PUBLIC_INFURA_ID } from "~utils/const"
import { formatUnits, parseUnits } from "ethers"
import type { PublicClient } from 'viem'
import { getBalance } from '~utils/ethers'

interface TransferTokenProps {
  visible: boolean
  setIsTransferVisible: React.Dispatch<React.SetStateAction<boolean>>

  tokens: Token[]
  currentChain: PublicClient
}

// ERC20 转账 ABI
const erc20Abi = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) returns (uint256)"
];

export default function TransferToken({ visible, setIsTransferVisible, tokens, currentChain }: TransferTokenProps) {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(false)

  // 获取选中代币的余额
  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedToken || !currentChain) {
        setBalance('0')
        return
      }

      try {
        const accountAddress = wallet.getCurrentAccountAddress()
        if (!accountAddress) {
          Toast.show('请先连接钱包')
          return
        }

        // 对于原生代币，使用 provider.getBalance
        if (!selectedToken.address) {
          const balance = await getBalance(accountAddress, currentChain);
          setBalance(formatUnits(balance, selectedToken.decimals));
          return;
        }

        // 对于 ERC20 代币，使用合约方法查询余额
        const balance = await getBalance(accountAddress, currentChain, selectedToken.address);
        setBalance(formatUnits(balance, selectedToken.decimals));
      } catch (err) {
        console.error('获取余额失败:', err)
        setBalance('0')
      }
    }

    fetchBalance()
  }, [selectedToken, currentChain])
  const onClose = () => {
    setIsTransferVisible(false)
  }
  const handleTokenChange = (value: (string | number)[]) => {
    console.log("value------------", value);

    const tokenValue = value[0];
    if (tokenValue === "native") {
      const { symbol, name, decimals } = currentChain.chain.nativeCurrency;
      let defaultToken = {
        address: "",
        name,
        symbol,
        decimals,
        chainId: currentChain.chain.id,
      };

      setSelectedToken(defaultToken);
      setAmount('');
    } else if (typeof tokenValue === 'string') {
      const token = tokens.find(t => t.address
        === tokenValue);
      console.log("token------------", token);

      if (token) {
        setSelectedToken(token);
        setAmount('');
      }
    }
  }

  const handleTransfer = async () => {
    if (!selectedToken) {
      Toast.show('请选择代币')
      return
    }

    if (!toAddress) {
      Toast.show('请输入接收地址')
      return
    }

    if (!isAddress(toAddress)) {
      Toast.show('请输入有效的地址')
      return
    }

    if (!amount) {
      Toast.show('请输入转账金额')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      Toast.show('请输入有效的转账金额')
      return
    }

    const balanceNum = parseFloat(balance)
    if (amountNum > balanceNum) {
      Toast.show('余额不足')
      return
    }

    setLoading(true)

    try {
      // 获取当前账户信息
      const account = wallet.getCurrentAccount()
      if (!account) {
        Toast.show('无法获取账户信息')
        setLoading(false)
        return
      }

      // 获取网络信息
      const chainName = currentChain.chain.id === 1 ? "mainnet" : currentChain.chain.name.toLocaleLowerCase();
      const infura = `https://${chainName}.infura.io/v3/${PLASMO_PUBLIC_INFURA_ID}`;
      const provider = new JsonRpcProvider(infura);

      // 使用账户私钥创建签名钱包
      const signer = new Wallet(account.privateKey, provider);

      if (!selectedToken.address) {
        // 转账原生代币（如 ETH）
        const transaction = {
          to: toAddress,
          value: parseUnits(amount, selectedToken.decimals)
        };

        const tx = await signer.sendTransaction(transaction);
        console.log('交易已发送:', tx.hash);
        Toast.show('转账已提交，等待确认')
      } else {
        // 转账 ERC20 代币
        const contract = new Contract(selectedToken.address, erc20Abi, signer);
        const tx = await contract.transfer(toAddress, parseUnits(amount, selectedToken.decimals));
        console.log('代币转账已发送:', tx.hash);
        Toast.show('代币转账已提交，等待确认')
      }

      // 关闭转账窗口
      onClose()
    } catch (error: any) {
      console.error('转账失败:', error)
      Toast.show(`转账失败: ${error.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 准备代币选择器数据
  const tokenOptions = tokens.map(token => ({
    label: `${token.name} (${token.symbol})`,
    value: token.address || 'native' // 使用地址作为唯一标识符
  }))

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnMaskClick={true}
      content={
        <div className="p-4 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center mb-6">转账</h2>

          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">选择代币</div>
            <Picker
              columns={[tokenOptions]}
              value={selectedToken ? [selectedToken.address || 'native'] : []}
              onConfirm={handleTokenChange}
            >
              {(_, actions) => (
                <Button
                  onClick={actions.open}
                  className="w-full"
                  disabled={!tokens.length}
                >
                  {selectedToken ? `${selectedToken.name} (${selectedToken.symbol})` : "请选择代币"}
                </Button>
              )}
            </Picker>
          </div>

          {selectedToken && (
            <div className="text-xs text-gray-500 mb-4 text-right">
              余额: {parseFloat(balance).toFixed(7)} {selectedToken.symbol}
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">接收地址</div>
            <TextArea
              placeholder="请输入接收地址"
              value={toAddress}
              onChange={setToAddress}
              rows={2}
            />
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-1">转账金额</div>
            <div className="flex">
              <Input
                placeholder="请输入转账金额"
                value={amount}
                onChange={setAmount}
                type="number"
                clearable
                className="flex-1"
              />
              {selectedToken && (
                <Button
                  size="small"
                  className="ml-2"
                  onClick={() => setAmount(balance)}
                >
                  全部
                </Button>
              )}
            </div>
            {selectedToken && (
              <div className="text-xs text-gray-500 mt-1">
                ≈ {(parseFloat(amount || '0') * 0).toFixed(7)} USD
              </div>
            )}
          </div>

          <Button
            color="primary"
            block
            loading={loading}
            onClick={handleTransfer}
            disabled={!selectedToken || !toAddress || !amount}
          >
            确认转账
          </Button>
        </div>
      }
    />
  )
}