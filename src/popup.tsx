import React from "react"
import Routes from "./router"
import { RouterProvider } from "react-router-dom"
import "./style.css"

function IndexPopup() {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        width: 360,
        height: 600
      }}>
      <RouterProvider router={Routes} />
    </div>
  )
}

export default IndexPopup