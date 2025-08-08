import React, { useState } from 'react';
import { Modal, Toast, Button, Input, TextArea } from 'antd-mobile';
import wallet from "~utils/wallet";
import { chains, addChain } from "~utils/viem";

interface AddChainProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddChain({ visible, onClose }: AddChainProps) {
  const [chainId, setChainId] = useState('');
  const [chainName, setChainName] = useState('');
  const [network, setNetwork] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('18');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddChain = async () => {
    if (!chainId || !chainName || !network || !rpcUrl || !symbol) {
      Toast.show('请填写所有必填字段');
      return;
    }

    setLoading(true);

    try {
      // 构建链配置对象
      const chainConfig = {
        id: parseInt(chainId),
        name: chainName,
        network: network,
        nativeCurrency: {
          name: symbol,
          symbol: symbol,
          decimals: parseInt(decimals),
        },
        rpcUrls: {
          default: { http: [rpcUrl] },
        },
        ...(explorerUrl && {
          blockExplorers: {
            default: { name: 'Explorer', url: explorerUrl },
          },
        }),
      };

      // 先添加到 viem 中
      const result = await addChain(chainConfig);
      
      if (result.success) {
        // 再添加到钱包存储中
        const walletResult = await wallet.addChain(chainConfig);
        
        if (walletResult.success) {
          Toast.show('链添加成功');
          // 清空表单
          setChainId('');
          setChainName('');
          setNetwork('');
          setRpcUrl('');
          setSymbol('');
          setDecimals('18');
          setExplorerUrl('');
          onClose();
        } else {
          Toast.show(`钱包存储失败: ${walletResult.error}`);
        }
      } else {
        Toast.show(`链连接测试失败: ${result.error}`);
      }
    } catch (error: any) {
      console.error('添加链失败:', error);
      Toast.show(`添加链失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      content={
        <div className="p-4 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center mb-6">添加新链</h2>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">链 ID *</div>
            <Input
              placeholder="请输入链 ID"
              value={chainId}
              onChange={setChainId}
              type="number"
            />
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">链名称 *</div>
            <Input
              placeholder="请输入链名称"
              value={chainName}
              onChange={setChainName}
            />
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">网络名称 *</div>
            <Input
              placeholder="请输入网络名称"
              value={network}
              onChange={setNetwork}
            />
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">RPC URL *</div>
            <TextArea
              placeholder="请输入 RPC URL"
              value={rpcUrl}
              onChange={setRpcUrl}
              rows={2}
            />
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">原生代币符号 *</div>
            <Input
              placeholder="请输入原生代币符号"
              value={symbol}
              onChange={setSymbol}
            />
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">代币小数位</div>
            <Input
              placeholder="请输入代币小数位"
              value={decimals}
              onChange={setDecimals}
              type="number"
            />
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-1">区块浏览器 URL</div>
            <TextArea
              placeholder="请输入区块浏览器 URL（可选）"
              value={explorerUrl}
              onChange={setExplorerUrl}
              rows={2}
            />
          </div>
          
          <Button 
            color="primary" 
            block 
            loading={loading}
            onClick={handleAddChain}
          >
            添加链
          </Button>
        </div>
      }
    />
  );
}