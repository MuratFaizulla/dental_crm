import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Schedule from './pages/admin/Schedule'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/schedule"
          element={
            <ProtectedRoute roles={['admin', 'doctor']}>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/admin/schedule" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
