import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Finance from './pages/admin/Finance'
import Debts from './pages/admin/Debts'
import AdminLayout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import Schedule from './pages/admin/Schedule'
import Patients from './pages/admin/Patients'
import PatientCard from './pages/admin/PatientCard'
import NewRecord from './pages/admin/NewRecord'
import Users from './pages/admin/Users'
import ClinicSettingsPage from './pages/admin/ClinicSettings'
import SMSLog from './pages/admin/SMSLog'
import Analytics from './pages/admin/Analytics'
import PortalLayout from './pages/portal/PortalLayout'
import Profile from './pages/portal/Profile'
import EditProfile from './pages/portal/EditProfile'
import ChangePassword from './pages/portal/ChangePassword'
import Family from './pages/portal/Family'
import Appointments from './pages/portal/Appointments'
import Files from './pages/portal/Files'
import TreatmentPlan from './pages/portal/TreatmentPlan'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function RootRedirect() {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'patient') return <Navigate to="/portal/profile" replace />
  return <Navigate to="/admin/dashboard" replace />
}

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
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientCard />} />
            <Route path="records/new" element={<NewRecord />} />
            <Route path="finance" element={<Finance />} />
            <Route path="debts" element={<Debts />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<ClinicSettingsPage />} />
            <Route path="sms-log" element={<SMSLog />} />
            <Route path="analytics" element={<Analytics />} />
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
            <Route path="appointments" element={<Appointments />} />
            <Route path="files" element={<Files />} />
            <Route path="plan" element={<TreatmentPlan />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
