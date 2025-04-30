import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    // You can also log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg m-4'>
          <h2 className='text-lg font-semibold text-red-800 dark:text-red-200 mb-2'>
            {this.props.errorMessage || 'An error occurred.'}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'>
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.defaultProps = {
  errorMessage: 'Something went wrong.',
}

export default ErrorBoundary
