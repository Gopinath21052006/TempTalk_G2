import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { UserProvider } from './contexts/UserContext'
import { HomePage } from './pages/HomePage'
import { ChatRoomPage } from './pages/ChatRoomPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DownloadPage } from './pages/DownloadPage'

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<ChatRoomPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#14b8a6', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </UserProvider>
  )
}
