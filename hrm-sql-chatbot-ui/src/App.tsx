import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminChatPage from './pages/AdminChatPage';
import ManagerChatPage from './pages/ManagerChatPage';
import EmployeeChatPage from './pages/EmployeeChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated, user } = useAuth();

  // Redirect đến trang phù hợp dựa trên role
  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'manager':
        return '/manager';
      default:
        return '/employee';
    }
  };

  return (
    <Routes>
      {/* Login Page */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />
        } 
      />

      {/* Admin Page */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminChatPage />
          </ProtectedRoute>
        } 
      />

      {/* Manager Page */}
      <Route 
        path="/manager" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <ManagerChatPage />
          </ProtectedRoute>
        } 
      />

      {/* Employee Page */}
      <Route 
        path="/employee" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
            <EmployeeChatPage />
          </ProtectedRoute>
        } 
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

export default App;