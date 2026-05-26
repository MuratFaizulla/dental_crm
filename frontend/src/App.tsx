import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Finance from './pages/admin/Finance'
import Debts from './pages/admin/Debts'
import AdminLayout from './pages/admin/Layout'
import Schedule from './pages/admin/Schedule'
import Patients from './pages/admin/Patients'
import PatientCard from './pages/admin/PatientCard'
import NewRecord from './pages/admin/NewRecord'
import PortalLayout from './pages/portal/PortalLayout'
import Profile from './pages/portal/Profile'
import EditProfile from './pages/portal/EditProfile'
import ChangePassword from './pages/portal/ChangePassword'
import Family from './pages/portal/Family'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="finance" element={<Finance />} />
            <Route path="debts" element={<Debts />} />
          </Route>
          <Route
            path="/portal"
            element={
              <ProtectedRoute roles={['patient']}>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="profile/password" element={<ChangePassword />} />
            <Route path="family" element={<Family />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/schedule" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
