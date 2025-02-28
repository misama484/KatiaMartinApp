import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HomeIcon, UserGroupIcon, CalendarIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import SpaIcon from '@mui/icons-material/Spa';

const navigation = [
  { name: 'Panel', href: '/', icon: HomeIcon },
  { name: 'Trabajadores', href: '/workers', icon: UserGroupIcon },
  { name: 'Clientes', href: '/clients', icon: UsersIcon },
  { name: 'Reservas', href: '/appointments', icon: CalendarIcon },
  { name: 'Facturas', href: '/invoices', icon: CurrencyDollarIcon },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-primary">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col h-full">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-gray-500 border-r border-gray-500 rounded-lg shadow h-full m-3">
          <div className="flex items-center flex-shrink-0 px-4">
            <SpaIcon className='m-2 text-gray-800'/>
            <h1 className="text-xl font-semibold text-gray-800">Katia Martin App</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-800 hover:bg-gray-50 hover:text-gray-900',
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
        <main className="flex-1 pb-8">
          <div className="mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}