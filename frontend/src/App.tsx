import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import AdminLayout from './pages/admin/Layout'
import Schedule from './pages/admin/Schedule'
import Patients from './pages/admin/Patients'
import PatientCard from './pages/admin/PatientCard'
import NewRecord from './pages/admin/NewRecord'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientCard />} />
            <Route path="records/new" element={<NewRecord />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/schedule" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
