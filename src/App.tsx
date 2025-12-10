import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { SiteConfigProvider } from '@/contexts/SiteConfigContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import FacilityList from './pages/facilities/index'
import FacilityDetail from './pages/facilities/Detail'
import FacilityTypes from './pages/FacilityTypes'
import Inspections from './pages/Inspections'
import Settings from './pages/Settings'
import Account from './pages/Account'
import AppLayout from './components/layout/AppLayout'
import ProtectedLayout from './components/layout/ProtectedLayout'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <SiteConfigProvider>
                <AuthProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            <Route element={<ProtectedLayout />}>
                                <Route element={<AppLayout />}>
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/facilities" element={<FacilityList />} />
                                    <Route path="/facilities/:id" element={<FacilityDetail />} />
                                    <Route path="/facility-types" element={<FacilityTypes />} />
                                    <Route path="/inspections" element={<Inspections />} />
                                    <Route path="/account" element={<Account />} />
                                    <Route path="/settings" element={<Settings />} />
                                </Route>
                            </Route>

                            {/* Catch all redirect */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Router>
                </AuthProvider>
            </SiteConfigProvider>
        </QueryClientProvider>
    )
}

export default App

