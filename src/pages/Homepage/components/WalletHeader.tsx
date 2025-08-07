import React from 'react'
import wallet from '~utils/wallet';
import { chains } from '~utils/viem'
import { Popup } from 'antd-mobile'
import { NetworkIcon } from '@web3icons/react'
import { PicturesOutline } from 'antd-mobile-icons'
interface WalletHeaderProps {
  currentChainId: number;
  isConnected: boolean;
  accountAddress: string;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => void;
  changeAccount: (e: any) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isMenuOpen: boolean) => void;
  isAccountMenuOpen: boolean;
  setIsAccountMenuOpen: (isAccountMenuOpen: boolean) => void;
}

// 格式化地址显示
const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
// 复制
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}

export default function WalletHeader(props: WalletHeaderProps) {
  const {
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
  } = props;
  return (
    <header className="flex justify-between items-center mb-6">
      <div className="relative">
        {isConnected ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center bg-white rounded-full py-2 px-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <NetworkIcon chainId={currentChainId} size={20} />
              </div>
            </button>
            <button onClick={() => {
              copyToClipboard(wallet.selectedAccount)
            }}>
              <PicturesOutline />
            </button>
            {isConnected ? (
              <div className="flex justify-between items-center space-x-4">
                <button onClick={(e) => changeAccount(e)} className="font-mono text-gray-500">
                  {/* 切换账号button */}
                  {formatAddress(accountAddress)}
                </button>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-white bg-blue-500 bg-opacity-90 hover:bg-opacity-100 rounded-full px-3 py-1 transition-colors"
                >
                  断开连接
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="w-full text-white bg-blue-600 font-medium py-3 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                连接钱包以查看资产
              </button>
            )}

            {/* 链切换菜单 */}
            {isMenuOpen && (
              <div className="fixed left-0 top-20 mt-2 w-64 bg-white rounded-xl shadow-lg z-10 border border-gray-200">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    选择网络
                  </div>
                  {Array.from(chains).map(([chainId, chain]) => (
                    <button
                      key={chainId}
                      onClick={() => switchChain(chainId)}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${currentChainId === chainId ? 'bg-blue-50' : ''
                        }`}
                    >
                      <div className="mr-3">
                        <NetworkIcon chainId={chainId} size={24} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{chain.chain.name}</div>
                      </div>
                      {currentChainId === chainId && (
                        <svg className="w-5 h-5 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 切换账号菜单 */}
            <Popup
              visible={isAccountMenuOpen}
              onMaskClick={() => {
                setIsAccountMenuOpen(false)
              }}
              onClose={() => {
                setIsAccountMenuOpen(false)
              }}
              position='top'
              bodyStyle={{ height: '50vh' }}
            >
              <div className='py-4 px-10'>
                <div className='text-3xl'>钱包</div>
                {
                  wallet.accounts.map((account) => (
                    <button
                      key={account.address}
                      onClick={() => {
                        wallet.switchAccount(account.address);
                        setIsAccountMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${wallet.selectedAccount === account.address ? 'bg-blue-50' : ''
                        }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{formatAddress(account.address)}</div>
                      </div>
                      {wallet.selectedAccount === account.address && (
                        <svg className="w-5 h-5 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                }
              </div>
            </Popup>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            连接钱包
          </button>
        )}
      </div>
    </header>
  )
}
