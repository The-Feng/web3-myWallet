import React, { useEffect, useState } from 'react'
import { NavBar, Space, Toast } from 'antd-mobile'
import { useNavigate } from "react-router-dom"
import { Steps } from 'antd-mobile'
import wallet from '~utils/wallet'
import MnemonicPhrase from './components/MnemonicPhrase'
import Password from './components/Password'
const { Step } = Steps
export default function CreateNewWallet() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [mnemonic, setMnemonic] = useState('')
  const back = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      navigate(-1)
    }
  }

  useEffect(() => {
    console.log('wallet', wallet);
    setMnemonic(wallet.generateSeedPhrase())
  }, [])

  const container = () => {
    switch (step) {
      case 1:
        return <div
          key="step0"
          className="transition-opacity duration-500 ease-in-out opacity-100"
        >
          <MnemonicPhrase setStep={setStep} mnemonic={mnemonic} />
        </div>
      case 2:
        return <div
          key="step1"
          className="transition-opacity duration-500 ease-in-out opacity-100"
        >
          <Password mnemonic={mnemonic} />
        </div>
      default:
        return null
    }
  }

  return (
    <div className="w-full h-full">
      <NavBar onBack={back}>
        <Steps current={step}>
          <Step />
          <Step />
          <Step />
        </Steps>
      </NavBar>
      {container()}
    </div>
  )
}