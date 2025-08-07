import { ChatApp } from './components/ChatApp'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ChatApp />
    </ErrorBoundary>
  )
}

export default App
