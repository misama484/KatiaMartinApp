import React, { useState } from 'react';
import { useClients } from '../hooks/useClients';
import ClientModal from '../components/modals/ClientModal';
import ClientDetailsModal from '../components/modals/ClientDetailsModal';
import { Client } from '../lib/api/clientsApi';
import { PencilIcon } from '@heroicons/react/24/outline';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import ModeEditIcon from '@mui/icons-material/ModeEdit';

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { data: clientsData, isLoading } = useClients();

  const openAddModal = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const openDetailsModal = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    // Small delay to avoid visual glitches when switching between add/edit modes
    setTimeout(() => {
      setSelectedClient(null);
    }, 200);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setTimeout(() => {
      setSelectedClient(null);
    }, 200);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all clients and their contact information.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add client
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
                      Phone
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Address
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Emergency Contact
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clientsData?.data?.map((client) => (
                    <tr key={client.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {client.first_name} {client.last_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.phone}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.address}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.emergency_contact_name ? (
                          <>
                            {client.emergency_contact_name} ({client.emergency_contact_phone})
                          </>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button 
                          onClick={() => openDetailsModal(client)}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <ManageHistoryIcon className="h-4 w-4 mr-1" />
                          Detalles
                        </button>

                        <button 
                          onClick={() => openEditModal(client)}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                          <ModeEditIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {clientsData?.data?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                        No clients found. Add a new client to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        client={selectedClient} 
      />

      <ClientDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={closeDetailsModal} 
        clientId={selectedClient?.id}
        clientName={`${selectedClient?.first_name} ${selectedClient?.last_name}`} 
      />
    </div>
  );
}