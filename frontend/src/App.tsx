import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './pages/admin/Layout'
import Schedule from './pages/admin/Schedule'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'doctor']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="schedule" element={<Schedule />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/schedule" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
