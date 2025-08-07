import React from 'react';
import { mainnet, sepolia, polygon, optimism, arbitrum, base } from 'viem/chains';

interface ChainIconProps {
  chainId: number;
  size?: number;
  className?: string;
}

const ChainIcon: React.FC<ChainIconProps> = ({ 
  chainId, 
  size = 24, 
  className = '' 
}) => {
  const getChainConfig = () => {
    switch (chainId) {
      case mainnet.id:
        return {
          name: 'Ethereum',
          shortName: 'ETH',
          color: 'bg-gray-800',
          textColor: 'text-white'
        };
      case sepolia.id:
        return {
          name: 'Sepolia',
          shortName: 'SEP',
          color: 'bg-blue-500',
          textColor: 'text-white'
        };
      case polygon.id:
        return {
          name: 'Polygon',
          shortName: 'POL',
          color: 'bg-purple-500',
          textColor: 'text-white'
        };
      case optimism.id:
        return {
          name: 'Optimism',
          shortName: 'OP',
          color: 'bg-red-500',
          textColor: 'text-white'
        };
      case arbitrum.id:
        return {
          name: 'Arbitrum',
          shortName: 'ARB',
          color: 'bg-blue-400',
          textColor: 'text-white'
        };
      case base.id:
        return {
          name: 'Base',
          shortName: 'BASE',
          color: 'bg-blue-600',
          textColor: 'text-white'
        };
      default:
        return {
          name: 'Unknown',
          shortName: '?',
          color: 'bg-gray-400',
          textColor: 'text-white'
        };
    }
  };

  const config = getChainConfig();

  return (
    <div 
      style={{ width: size, height: size }}
      className={`${className} ${config.color} rounded-full flex items-center justify-center`}
    >
      <span className={`font-bold ${config.textColor}`} style={{ fontSize: size * 0.4 }}>
        {config.shortName}
      </span>
    </div>
  );
};

export default ChainIcon;