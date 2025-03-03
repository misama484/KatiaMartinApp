import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAddWorker } from '../../hooks/useWorkers';
import { Worker } from '../../lib/api/workersApi';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWorkerModal({ isOpen, onClose }: AddWorkerModalProps) {
  const [formData, setFormData] = useState<Omit<Worker, 'id'>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    availability: '',
    //active: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const addWorkerMutation = useAddWorker();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.role.trim()) {
      newErrors.role = 'role is required';
    }
    
    // Email format validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await addWorkerMutation.mutateAsync(formData);
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled by the mutation and displayed via toast
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: '',
      availability: '',
      //active: '',
    });
    setErrors({});
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Añadir nuevo trabajador
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Porfavor introduzca los datos del nuevo empleado. Los campos marcados con * son obligatorios.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.first_name ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.last_name ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.email ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Telefono *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.phone ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        rol *
                      </label>
                      <input
                        type="text"
                        name="rol"
                        id="rol"
                        value={formData.role}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.role ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.role && (
                        <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                        Disponibilidad
                      </label>availability
                      <input
                        type="text"
                        name="availability"
                        id="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                   
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={addWorkerMutation.isPending}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    >
                      {addWorkerMutation.isPending ? 'Adding...' : 'Añadir trabajador'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    >
                      Limpiar campos
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}