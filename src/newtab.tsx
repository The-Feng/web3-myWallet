import React from "react"
import { RouterProvider } from "react-router-dom"
import router from "./router"

import "./style.css"

function IndexNewtab() {
  return (
    <div
      className="new-tab"
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%"
      }}>
      <RouterProvider router={router} />
    </div>
  )
}

export default IndexNewtab