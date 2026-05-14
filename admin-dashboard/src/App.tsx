import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import Dashboard from '@/pages/Dashboard';
import UsersList from '@/pages/Users';
import RolesList from '@/pages/Roles';
import PropertiesList from '@/pages/Properties';
import RoomsList from '@/pages/Rooms';
import OrdersList from '@/pages/Orders';
import PaymentsList from '@/pages/Payments';
import ReviewsList from '@/pages/Reviews';
import Login from '@/pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  // Kiểm tra role từ localStorage
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = (user.role || '').toLowerCase();
      if (role !== 'admin') {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
              <p className="text-muted-foreground">You don't have permission to access the Admin Dashboard.</p>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        );
      }
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="roles" element={<RolesList />} />
          <Route path="properties" element={<PropertiesList />} />
          <Route path="rooms" element={<RoomsList />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="payments" element={<PaymentsList />} />
          <Route path="reviews" element={<ReviewsList />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
