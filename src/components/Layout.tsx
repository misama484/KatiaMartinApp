import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, CalendarIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import SpaIcon from '@mui/icons-material/Spa';
import { useAuth, signOut } from '../hooks/useAuth';
import ChangePasswordModal from './modals/ChangePasswordModal';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Panel', href: '/', icon: HomeIcon },
  { name: 'Trabajadores', href: '/workers', icon: UserGroupIcon, requiresAdmin: false },
  { name: 'Clientes', href: '/clients', icon: UsersIcon },
  { name: 'Reservas', href: '/appointments', icon: CalendarIcon },
  { name: 'Facturas', href: '/invoices', icon: CurrencyDollarIcon, requiresAdmin: true },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check if user is an admin
  const isAdmin = user?.user_metadata?.user_role === 'admin';
  
  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => 
    !item.requiresAdmin || isAdmin
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };


    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-semibold text-gray-800">Elderly Care</h1>
              </div>
              <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={clsx(
                          isActive
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <item.icon
                          className={clsx(
                            isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
  
          {/* Main content */}
          <div className="flex flex-col flex-1">
            {/* Top navigation bar */}
            <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
              <div className="flex-1 px-4 flex justify-end">
                <div className="ml-4 flex items-center md:ml-6">
                  {/* User dropdown */}
                  <div className="ml-3 relative">
                    <div>
                      <button
                        type="button"
                        className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        id="user-menu-button"
                        aria-expanded="false"
                        aria-haspopup="true"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                      >
                        <span className="sr-only">Open user menu</span>
                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        <span className="ml-2 text-gray-700">{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</span>
                      </button>
                    </div>
                    
                    {/* Dropdown menu */}
                    {userMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                        tabIndex={-1}
                      >
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => {
                            setIsPasswordModalOpen(true);
                            setUserMenuOpen(false);
                          }}
                        >
                          Change Password
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                          role="menuitem"
                          tabIndex={-1}
                          onClick={handleSignOut}
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
  
            <main className="flex-1 pb-8">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Change Password Modal */}
        <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      </div>
    );
  }