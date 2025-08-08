import React, { useEffect, useMemo, useState } from "react";
import wallet, { type Token } from "~utils/wallet";
import { getChainClient, chains as allChains } from "~utils/viem";

export const getChainTokens = () => {
  const currentChainId = wallet.currentChainId;
  const currentChain = getChainClient(currentChainId);
  if (!currentChain) {
    return [];
  } else {
    const { symbol, name, decimals } = currentChain.chain.nativeCurrency;
    let defaultToken = {
      address: "",
      name,
      symbol,
      decimals,
      chainId: currentChain.chain.id,
    };
    const chainTokens = wallet.tokens.get(currentChainId) || [];
    return [defaultToken, ...chainTokens];
  }
};
