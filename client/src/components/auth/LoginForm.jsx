import { useState } from 'react'
import { login, register } from '../../services/api'
import Button from '../common/ui/Button'
import LoadingSpinner from '../common/ui/LoadingSpinner'
import Error from '../common/ui/Error'

const LoginForm = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.email || !formData.password || (isRegister && !formData.username)) {
      setError('Please fill in all required fields')
      return
    }

    if (isRegister) {
      if (!/^[a-zA-Z0-9]{6,}$/.test(formData.username)) {
        setError('Username must be at least 6 characters and contain only letters and numbers')
        return
      }
    }

    if (!/^[a-zA-Z0-9]{6,}$/.test(formData.password)) {
      setError('Password must be at least 6 characters and contain only letters and numbers')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let res
      if (isRegister) {
        res = await register(formData.email, formData.username, formData.password)
      } else {
        res = await login(formData.email, formData.password)
      }
      if (res?.user && res?.token) {
        console.log('Login successful, passing token to onLoginSuccess:', res.token)
        onLoginSuccess({
          user: res.user,
          token: res.token,
        })
      } else {
        setError(res?.error || 'Authentication failed')
      }
    } catch (error) {
      setError(error.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setFormData({ email: '', password: '', username: '' })
  }

  const inputClassName =
    'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500'

  if (isLoading) {
    return (
      <div className='min-h-screen grid place-items-center p-4 bg-gray-50 dark:bg-gray-900'>
        <LoadingSpinner />
      </div>
    )
  }
  if (error) {
    return (
      <div className='min-h-screen grid place-items-center p-4 bg-gray-50 dark:bg-gray-900'>
        <Error error={error} />
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='bg-white/80 dark:bg-gray-800/90 p-8 rounded-2xl shadow-xl'>
          <img
            className='mx-auto mb-8 w-auto'
            src='/logo.png'
            alt='Logo'
          />

          {error && (
            <div className='mb-6 bg-red-100 dark:bg-red-900/30 text-red-600 p-3 rounded-lg'>
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className='space-y-4'>
            {isRegister ? (
              <>
                <input
                  type='email'
                  required
                  className={inputClassName}
                  placeholder='Email address'
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <input
                  type='text'
                  required
                  className={inputClassName}
                  placeholder='Username'
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </>
            ) : (
              <input
                type='text'
                required
                className={inputClassName}
                placeholder='Email or Username'
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            )}
            <input
              type='password'
              required
              className={inputClassName}
              placeholder='Password'
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />

            <Button
              type='submit'
              variant='primary'
              disabled={isLoading}
              fullWidth='true'>
              {isLoading ? 'Loading...' : isRegister ? 'Register' : 'Sign in'}
            </Button>

            <div className='text-center text-gray-500 dark:text-gray-400 my-4'>
              {isRegister ? 'Already registered?' : 'Need an account?'}
            </div>

            <Button
              type='button'
              variant='nav'
              onClick={toggleMode}
              fullWidth='true'>
              {isRegister ? 'Sign in' : 'Register'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
