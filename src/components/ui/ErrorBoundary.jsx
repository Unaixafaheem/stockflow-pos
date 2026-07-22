import { Component } from 'react'
import Button from './Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong' }
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' })
    if (typeof this.props.onRetry === 'function') this.props.onRetry()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/40 dark:bg-rose-950/30">
          <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-300">This page hit an error</h2>
          <p className="mt-2 text-sm text-rose-700/90 dark:text-rose-400/90">{this.state.message}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => window.location.assign('/dashboard')}>
              Go to dashboard
            </Button>
            <Button onClick={this.handleRetry}>Try again</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
