import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import FacilityList from './pages/facilities/index'
import FacilityDetail from './pages/facilities/Detail'
import AppLayout from './components/layout/AppLayout'
import ProtectedLayout from './components/layout/ProtectedLayout'

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route element={<ProtectedLayout />}>
                            <Route element={<AppLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/facilities" element={<FacilityList />} />
                                <Route path="/facilities/:id" element={<FacilityDetail />} />
                            </Route>
                        </Route>

                        {/* Catch all redirect */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App
