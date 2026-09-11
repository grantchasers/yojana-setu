import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'

// Dynamically resolve page components as they get implemented in subsequent prompts
const pageModules = import.meta.glob('./pages/*.jsx', { eager: true })

function renderPage(moduleName, defaultElement) {
  const mod = pageModules[`./pages/${moduleName}.jsx`]
  if (mod && mod.default) {
    const Component = mod.default
    return <Component />
  }
  return defaultElement
}

const AuthPage = () =>
  renderPage(
    'AuthPage',
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface p-4">
      <div className="p-8 max-w-md w-full text-center bg-surface border border-outline-variant/30 rounded-xl shadow-xs">
        <h1 className="text-2xl font-bold mb-2 text-primary">YojanaSetu</h1>
        <p className="text-on-surface-variant text-sm">Auth page (Sign in / Sign up)</p>
      </div>
    </div>
  )

const DashboardPage = () =>
  renderPage(
    'DashboardPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-on-surface-variant text-sm">Welcome to YojanaSetu Dashboard</p>
    </div>
  )

const RecommenderPage = () =>
  renderPage(
    'RecommenderPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Scheme Recommender</h1>
      <p className="text-on-surface-variant text-sm">Recommender wizard</p>
    </div>
  )

const RecommendationResultPage = () =>
  renderPage(
    'RecommendationResultPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Recommendation Result</h1>
      <p className="text-on-surface-variant text-sm">Matched schemes and next steps</p>
    </div>
  )

const CalculatorPage = () =>
  renderPage(
    'CalculatorPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Financial Calculator</h1>
      <p className="text-on-surface-variant text-sm">EMI projection</p>
    </div>
  )

const LocatorPage = () =>
  renderPage(
    'LocatorPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Partner Locator</h1>
      <p className="text-on-surface-variant text-sm">Channel partner map and directory</p>
    </div>
  )

const ApplicationsPage = () =>
  renderPage(
    'ApplicationsPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">My Applications</h1>
      <p className="text-on-surface-variant text-sm">Track your application status</p>
    </div>
  )

const AdminPartnersPage = () =>
  renderPage(
    'AdminPartnersPage',
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Admin — Partner Management</h1>
      <p className="text-on-surface-variant text-sm">Manage channel partners and schemes</p>
    </div>
  )

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth: no AppShell */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected routes wrapped in ProtectedRoute then AppShell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recommender"
            element={
              <ProtectedRoute>
                <AppShell>
                  <RecommenderPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recommender/result"
            element={
              <ProtectedRoute>
                <AppShell>
                  <RecommendationResultPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/calculator"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CalculatorPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/locator"
            element={
              <ProtectedRoute>
                <AppShell>
                  <LocatorPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ApplicationsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Admin route: requireRole="admin" */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <AppShell>
                  <AdminPartnersPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
