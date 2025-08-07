import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
import wallet from '~utils/wallet';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'antd-mobile';

export default function Password(props: {
  mnemonic: string
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const navigate = useNavigate()

  // 检查密码强度
  const checkPasswordStrength = (pwd: string) => {
    // 至少8个字符，包含大小写字母和数字
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongPasswordRegex.test(pwd);
  };

  const onSubmit = async () => {
    const result = await wallet.createWallet(password, props.mnemonic)
    if (result.success) {
      navigate('/homepage')
    } else {
      Toast.show({
        icon: 'fail',
        content: result.error,
      })
    }
  }

  // 处理密码输入变化
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pwd = e.target.value;
    setPassword(pwd);
    setError('');

    // 检查密码强度
    if (pwd && !checkPasswordStrength(pwd)) {
      setError('密码至少需要8位，包含大小写字母和数字');
    } else if (pwd) {
      setIsPasswordValid(true);
    } else {
      setIsPasswordValid(false);
    }
  }, []);

  // 处理确认密码输入变化
  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPwd = e.target.value;
    setConfirmPassword(confirmPwd);
    if (confirmPwd && confirmPwd !== password) {
      setError('密码不一致');
      setIsPasswordValid(false);
    } else {
      setError('');
      setIsPasswordValid(true);
    }
  }, [password])

  // 提交表单
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // 检查密码强度
    if (!checkPasswordStrength(password)) {
      setError('密码至少需要8位，包含大小写字母和数字');
      return;
    }

    // 检查密码是否匹配
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 提交密码
    // if (onSubmit) {
    //   onSubmit(password);
    // }
  }, [password, confirmPassword])

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">创建密码</h1>
        <p className="text-gray-600">请设置一个安全的密码来保护您的钱包</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="请输入密码"
          />
          {password && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${checkPasswordStrength(password)
                    ? 'bg-green-500'
                    : 'bg-red-500'
                    }`}
                  style={{
                    width: checkPasswordStrength(password) ? '100%' : '30%'
                  }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${checkPasswordStrength(password) ? 'text-green-600' : 'text-red-600'}`}>
                {checkPasswordStrength(password)
                  ? '密码强度: 安全'
                  : '密码强度: 不安全（至少8位，包含大小写字母和数字）'}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            确认密码
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="请再次输入密码"
          />
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className=' fixed bottom-4 left-0 w-full px-20'>
          <button
            disabled={!password || !confirmPassword || !isPasswordValid} className={classnames('text-white w-full py-2 rounded-full cursor-pointer', password && confirmPassword && isPasswordValid
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400 cursor-not-allowed'
            )} onClick={() => {
              onSubmit()
            }}>
            提交
          </button>
        </div>
      </form>
    </div>
  );
}