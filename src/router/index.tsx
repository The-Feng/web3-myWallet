import React from 'react'
import {
  createBrowserRouter,
  useParams,
  Navigate
} from "react-router-dom"
import Transit from '~pages/Transit'
import Connect from '~pages/Connect'
import Homepage from '~pages/Homepage'
import CreateNewWallet from '~pages/CreateNewWallet'

// 添加错误页面组件
function ErrorPage() {
  return (
    <div className="error-page" style={{ padding: '20px' }}>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Transit />,
    errorElement: <ErrorPage />
  },
  {
    path: "/connect",
    element: <Connect />
  },
  {
    path: "/create",
    element: <CreateNewWallet />
  },
  {
    path: "homepage",
    element: <Homepage />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
])

export default router