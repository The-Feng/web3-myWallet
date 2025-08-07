import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Connect() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    // 页面加载后触发动画
    setIsVisible(true);

    // 步骤指示器动画
    const stepTimer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(stepTimer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center mb-10">
          <div className="relative inline-block">
            {/* 动画圆形背景 */}
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-2">欢迎使用 Web3 钱包</h1>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-500">
            <div className="flex items-center mb-4">
              <div className="mr-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">创建或导入钱包</h3>
                <p className="text-sm text-gray-600">设置您的第一个数字钱包</p>
              </div>
            </div>

            <div className="flex items-center mb-4">
              <div className="mr-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">安全备份</h3>
                <p className="text-sm text-gray-600">保护您的资产安全</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="mr-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-500 font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">开始探索</h3>
                <p className="text-sm text-gray-600">连接去中心化应用</p>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => navigate("/create")} className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            创建新钱包
          </button>
          <button className="px-6 py-3 bg-white text-blue-500 font-medium rounded-lg shadow-md hover:bg-gray-50 transition-colors duration-300 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            导入钱包
          </button>
        </div>
      </div>
    </div>
  );
}