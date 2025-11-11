import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console?.error('Uncaught error:', error, errorInfo)
    this?.setState({
      error,
      errorInfo,
    })
  }

  private handleReload = () => {
    window?.location.reload()
  }

  private handleGoHome = () => {
    window?.location.href = '/'
  }

  private getSolution(error: Error): string {
    const message = error?.message.toLowerCase()

    // Firebase errors
    if (message?.includes('permission') || message?.includes('denied')) {
      return 'Проблем с достъпа до данните. Проверете дали сте влезли в системата или се свържете с администратор.'
    }

    if (message?.includes('network') || message?.includes('failed to fetch')) {
      return 'Няма връзка с интернет. Проверете интернет свързаността и опитайте отново.'
    }

    if (message?.includes('firebase') || message?.includes('firestore')) {
      return 'Проблем с базата данни. Опитайте да презаредите страницата или се свържете с администратор.'
    }

    // React errors
    if (message?.includes('undefined') || message?.includes('null')) {
      return 'Липсват данни. Опитайте да презаредите страницата.'
    }

    if (message?.includes('type') || message?.includes('function')) {
      return 'Техническа грешка в приложението. Моля презаредете страницата.'
    }

    // Default
    return 'Възникна неочаквана грешка. Моля презаредете страницата или се свържете с администратор ако проблемът продължава.'
  }

  public render() {
    if (this?.state.hasError && this?.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-500">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-50 rounded-full">
                  <AlertTriangle className="w-16 h-16 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
                Опа! Възникна проблем
              </h1>

              {/* Error Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-mono text-red-800 break-all">
                  {this?.state.error?.message}
                </p>
              </div>

              {/* Solution */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  💡 Решение:
                </h3>
                <p className="text-blue-800">
                  {this?.getSolution(this?.state.error)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this?.handleReload}
                  className="btn btn-primary flex-1"
                >
                  <RefreshCw className="w-5 h-5" />
                  Презареди страницата
                </button>
                <button
                  onClick={this?.handleGoHome}
                  className="btn btn-secondary flex-1"
                >
                  <Home className="w-5 h-5" />
                  Към началната страница
                </button>
              </div>

              {/* Details (expandable for developers) */}
              {process?.env.NODE_ENV === 'development' && this?.state.errorInfo && (
                <details className="mt-6 bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Технически детайли (за разработчици)
                  </summary>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                    {this?.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Contact Info */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Ако проблемът продължава, моля свържете се с администратор
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this?.props.children
  }
}

export default ErrorBoundary
