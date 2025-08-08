import React, { useState, useEffect, useMemo } from 'react';
import { Popup, Space, Button, Tabs, Toast } from 'antd-mobile'
import { getChainClient } from "~/utils/viem"
import wallet, { type Token } from '~utils/wallet';
import { useNavigate } from 'react-router-dom';
import WalletHeader from './components/WalletHeader';
import TokenTab from './components/TokenTab';
import { getChainTokens } from '~utils/getChainTokens';
import TransferToken from './components/TransforToken';

const Tab = Tabs.Tab

export default function Homepage() {
  const [currentChainId, setCurrentChainId] = useState(wallet.currentChainId);
  const [totalValue, setTotalValue] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isTransferVisible, setIsTransferVisible] = useState(false);
  // const [assets, setAssets] = useState<Token[]>([]);

  const assets = useMemo(() => {
    console.log("wallet change =========");

    // return wallet.tokens.get(currentChainId) || []
    return getChainTokens()
  }, [wallet.tokens, currentChainId])


  const navigate = useNavigate()

  const currentChain = useMemo(() => {
    return getChainClient(currentChainId);
  }, [currentChainId]);

  const accountAddress = useMemo(() => {
    console.log("useMemo wallet 变化");

    return wallet.selectedAccount
  }, [wallet.selectedAccount])
  // 计算总资产价值
  useEffect(() => {
    const total = assets.reduce((sum, asset) => sum + Number(0), 0);
    setTotalValue(total);
  }, [assets]);
  // useEffect(() => {
  //   setAssets(getChainTokens())
  // }, [wallet.tokens, currentChainId]);
  // 切换链
  const switchChain = (chainId) => {
    setCurrentChainId(chainId);
    setIsMenuOpen(false);
    wallet.notifyNetworkChanged(chainId)
  };

  // 连接钱包
  const connectWallet = () => {
    // 模拟连接钱包
    setIsConnected(true);
    console.log('钱包已连接');
  };

  // 断开钱包连接
  const disconnectWallet = async () => {
    setIsConnected(false);
    const result = await wallet.disconnect()
    if (result.success) {
      navigate('/')
    }
  };

  const changeAccount = (e) => {
    e.preventDefault();
    setIsAccountMenuOpen(!isAccountMenuOpen)
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* 头部导航栏 */}
      <WalletHeader {...{
        currentChainId,
        isConnected,
        accountAddress,
        connectWallet,
        disconnectWallet,
        switchChain,
        changeAccount,
        isMenuOpen,
        setIsMenuOpen,
        isAccountMenuOpen,
        setIsAccountMenuOpen
      }} />
      {/* 主要内容区域 */}
      <main>
        {/* 转账区域 */}
        <div className='mb-4'>
          <Button
            block
            color='primary'
            size='large'
            onClick={() => setIsTransferVisible(true)}
          >
            转账
          </Button>
        </div>
        <Tabs defaultActiveKey="1">
          <Tab title="代币" key="1">
            <TokenTab accountAddress={accountAddress} assets={assets} currentChain={currentChain} />
          </Tab>
          <Tab title="收藏品" key="2">
          </Tab>
        </Tabs>

        {/* 转账模态框 */}
        <TransferToken
          visible={isTransferVisible}
          setIsTransferVisible={setIsTransferVisible}
          tokens={assets}
          currentChain={currentChain}
        />

        {/* {isConnected && (
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="bg-white rounded-xl py-2 px-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </button>
            <button className="bg-white rounded-xl py-2 px-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
            </button>
          </div>
        )} */}
      </main>
    </div>
  );
}