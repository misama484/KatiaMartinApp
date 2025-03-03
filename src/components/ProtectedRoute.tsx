import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ChangePasswordModal from './modals/ChangePasswordModal';

export default function ProtectedRoute() {
  const { user, loading, mustChangePassword } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Show password change modal if user must change password
  React.useEffect(() => {
    if (mustChangePassword) {
      setIsPasswordModalOpen(true);
    }
  }, [mustChangePassword]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Outlet />
      
      {/* Force password change modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)}
        isFirstLogin={mustChangePassword}
      />
    </>
  );
}