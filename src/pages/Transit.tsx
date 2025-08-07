import React, { useEffect } from 'react'
import wallet from '~utils/wallet'
import { useNavigate, useLocation } from "react-router-dom"

export default function Transit() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    console.log("wallet.selectedAccount", wallet.selectedAccount, location.pathname);


    if (!wallet.selectedAccount) {
      navigate('/connect', { replace: true })
    } else {
      navigate('/homepage', { replace: true })
    }
  }, [])

  return (
    <div className='w-full h-full flex justify-center items-center bg-gray-50'>
      <div className="flex flex-col items-center">
        {/* Loading spinner */}
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}