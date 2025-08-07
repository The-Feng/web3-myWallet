import React from 'react'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ 
  message = '加载中...', 
  size = 'md' 
}: LoadingProps) {
  // 根据size属性确定loading圆圈的尺寸
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  }
  
  const borderSize = sizeClasses[size]
  
  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col items-center">
        <div className={`${borderSize} border-blue-500 border-t-transparent rounded-full animate-spin mb-2`}></div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// 全局居中的Loading页面组件
export function LoadingPage({ 
  message = '加载中...',
  size = 'md'
}: LoadingProps) {
  return (
    <div className='w-full h-full flex justify-center items-center bg-gray-50'>
      <Loading message={message} size={size} />
    </div>
  )
}