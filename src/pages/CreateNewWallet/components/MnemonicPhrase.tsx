import React, { useState, type Dispatch, type SetStateAction } from 'react'
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}
export default function MnemonicPhrase(props: {
  mnemonic: string
  setStep: Dispatch<SetStateAction<number>>
}) {
  const [copied, setCopied] = useState(false)
  const copyMnemonic = async () => {
    const flag = await copyToClipboard(props.mnemonic)
    if (flag) {
      setCopied(true)
    } else {
      setCopied(false)
    }
  }
  return (
    <div className=''>
      <h2>备份您的钱包</h2>
      <p>请将助记词保存在安全的地方，请勿将助记词分享给任何人。</p>
      <div className='bg-gray-100 p-4 rounded-lg mb-4 mt-4'>
        <p id='mnemonic' className='text-sm'>
          {props.mnemonic}
        </p>
      </div>
      {
        copied ? (
          <button onClick={() => copyMnemonic()} className='bg-green-500 text-white px-4 py-2 rounded-lg'>
            已复制助记词
          </button>
        ) : (
          <button className='bg-blue-500 text-white px-4 py-2 rounded-lg' onClick={() => copyMnemonic()}>
            复制助记词
          </button>
        )
      }
      <div className=' fixed bottom-4 left-0 w-full px-20'>
        <button className='bg-blue-500 text-white w-full py-2 rounded-full cursor-pointer' onClick={() => { props.setStep(2) }}>
          继续
        </button>
      </div>
    </div>
  )
}
