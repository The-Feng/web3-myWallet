import React, { useMemo, useState, useCallback } from 'react'
import { type Token } from "~utils/wallet"
import wallet from "~utils/wallet"
import { TokenIcon } from '@web3icons/react'
import { NavBar, Space, Modal, Toast } from 'antd-mobile'
import { AddOutline, SendOutline } from 'antd-mobile-icons'
import Tokens from './Tokens'
import TransferToken from './TransforToken'
import { JsonRpcProvider, Contract, isAddress, getAddress } from "ethers"
import { PLASMO_PUBLIC_INFURA_ID } from "~utils/const"
import { getContranct } from "~utils/ethers"
import type { PublicClient } from 'viem'

// {
//   address: string;
//   name: string;
//   symbol: string;
//   decimals: number;
//   logoURI?: string;
//   balance?: string;
//   chainId: number; // 添加链ID以支持不同链的代币
// }

// {
//     id: string;
//     name: string;
//     symbol: string;
//     balance: number;
//     value: number;
//     icon: string;
//     change: number;
//   }
export default function TokenTab(props: {
  assets: Token[]
  currentChain: PublicClient,
  accountAddress: string
}) {
  const [visible, setVisible] = useState(false)
  const [transferVisible, setTransferVisible] = useState(false)
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDecimals, setTokenDecimals] = useState(18)
  const { assets, currentChain } = props

  // 创建一个重置状态的函数
  const resetFormState = useCallback(() => {
    setTokenAddress('')
    setTokenName('')
    setTokenSymbol('')
    setTokenDecimals(18)
  }, [])

  const addToken = () => {
    if (!currentChain?.chain) {
      Toast.show('未选择链')
      return
    }

    if (assets.find(item => item.address === tokenAddress.trim())) {
      Toast.show('代币已存在')
      return
    }
    const token = {
      address: tokenAddress.trim(),
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      chainId: currentChain.chain.id,
      balance: "0" // 添加默认余额
    }

    wallet.addToken(token)
    initialState()
  }

  const initialState = () => {
    setTokenAddress('')
    setTokenName('')
    setTokenSymbol('')
    setTokenDecimals(18)
    setVisible(false)
  }

  const addressChange = async (val: string) => {
    setTokenAddress(val)
    if (val.length === 42 && isAddress(val) && currentChain?.chain) {
      try {
        const contract = getContranct(val, currentChain)
        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
        ])

        setTokenName(name)
        setTokenSymbol(symbol)
        setTokenDecimals(decimals)
      } catch (error) {
        setTokenName('');
        setTokenSymbol('');
        setTokenDecimals(18);
        Toast.show('请检查输入的代币地址是否正确');
      }
    }
  }

  const handleAddTokenSuccess = useCallback(() => {
    setVisible(false)
    resetFormState()
  }, [resetFormState])

  const handleAddTokenCancel = useCallback(() => {
    setVisible(false)
    resetFormState()
  }, [resetFormState])

  const handleTransferSuccess = useCallback(() => {
    setTransferVisible(false)
    // 可以添加刷新资产的逻辑
  }, [])

  const handleTransferCancel = useCallback(() => {
    setTransferVisible(false)
  }, [])

  return (
    <div className=''>
      {/* 添加代币操作 */}
      <NavBar
        style={{
          '--height': '36px',
          '--border-bottom': '1px #eee solid',
        }}
        back={null}
        right={
          <div className="flex">
            <Space onClick={() => {
              setVisible(true)
            }} style={{ '--gap': '16px' }}>
              <AddOutline />
            </Space>
            <Space onClick={() => {
              setTransferVisible(true)
            }} style={{ '--gap': '16px' }} className="ml-4">
              <SendOutline />
            </Space>
          </div>
        }
      >
      </NavBar>
      <div className="bg-white shadow-sm rounded-2xl max-h-[250px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="divide-y divide-gray-100">
          {assets.map((asset) => <Tokens key={asset.address} asset={asset} currentChain={currentChain} />)}
        </div>
      </div>
      <Modal
        closeOnMaskClick={true}
        showCloseButton={true}
        onClose={() => initialState()}
        content={(
          <>
            <div className="text-lg font-medium text-center">
              添加代币
            </div>
            <input type="text" disabled={true} className='w-full px-4 py-3 bg-slate-200 mb-2' value={currentChain?.chain?.name || ''} />
            <input placeholder='输入代币地址' value={tokenAddress} type="text" className='w-full px-4 py-3 bg-slate-200 mb-2' onChange={(e) => { addressChange(e.target.value) }} />
            <input type="text" disabled={true} className='w-full px-4 py-3 bg-slate-200 mb-2' value={tokenName} placeholder="代币名称" />
            <input type="text" disabled={true} className='w-full px-4 py-3 bg-slate-200 mb-2' value={tokenSymbol} placeholder="代币符号" />
            <button disabled={!tokenName || !tokenSymbol} className='w-full px-4 py-3 bg-blue-500 text-white rounded-md' onClick={() => {
              addToken()
            }}>
              确定
            </button>
          </>
        )}
      />
    </div>
  )
}