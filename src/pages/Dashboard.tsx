import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { UserGroupIcon, UsersIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import CalendarDashboard from '../components/CalendarDashboard';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [workers, clients, appointments, invoices] = await Promise.all([
        supabase.from('workers').select('count').single(),
        supabase.from('clients').select('count').single(),
        supabase.from('appointments').select('count').single(),
        supabase.from('invoices').select('count').single(),
      ]);

      return {
        workers: workers.data?.count || 0,
        clients: clients.data?.count || 0,
        appointments: appointments.data?.count || 0,
        invoices: invoices.data?.count || 0,
      };
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Panel</h1>
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Trabajadores</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.workers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Clientes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.clients}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Reservas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.appointments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Facturas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.invoices}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CalendarDashboard />

    </div>
  );
}