import React, { useState } from 'react';
import { useWorkers } from '../hooks/useWorkers';
import WorkerModal from '../components/modals/WorkerModal';
import { Worker } from '../lib/api/workersApi';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function Workers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { data: workersData, isLoading } = useWorkers();

  const openAddModal = () => {
    setSelectedWorker(null);
    setIsModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Small delay to avoid visual glitches when switching between add/edit modes
    setTimeout(() => {
      setSelectedWorker(null);
    }, 200);
  };

  // Filter workers by role if a filter is selected
  const filteredWorkers = workersData?.data?.filter(worker => 
    !roleFilter || worker.role === roleFilter
  );

  // Get unique roles for the filter dropdown
  const uniqueRoles = workersData?.data 
    ? Array.from(new Set(workersData.data.map(worker => worker.role)))
    : [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Workers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all care workers including their name, role, and contact information.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
          <div>
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add worker
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredWorkers?.map((worker) => (
                    <tr key={worker.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {worker.first_name} {worker.last_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{worker.role}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{worker.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{worker.phone || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          worker.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {worker.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button 
                          onClick={() => openEditModal(worker)}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredWorkers?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                        {roleFilter ? `No workers found with role "${roleFilter}".` : 'No workers found. Add a new worker to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <WorkerModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        worker={selectedWorker} 
      />
    </div>
  );
}