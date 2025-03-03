import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAddWorker, useUpdateWorker, useDeleteWorker, resetWorkerPassword } from '../../hooks/useWorkers';
import { Worker } from '../../lib/api/workersApi';
import { useAuth } from '../../hooks/useAuth';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker?: Worker | null; // If provided, we're in edit mode
}

const ROLE_OPTIONS = [
  'Cuidador',
  'Niñera',
  'Terapeuta',
  'Fisioterapeuta',
  'Enfermero',
  'Nutricionista',
  'Mantenimiento',
  'Administrativo',
  'Tecnico',
  'Admin'
];

const USER_ROLE_OPTIONS = [
  { value: 'worker', label: 'Worker' },
  { value: 'admin', label: 'Administrator' }
]

// Days of the week for availability
const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo'
];

export default function WorkerModal({ isOpen, onClose, worker }: WorkerModalProps) {
  const isEditMode = !!worker;
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Omit<Worker, 'id'>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Cuidador',
    availability: {},
    active: true,
    user_role: 'worker'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  
  const addWorkerMutation = useAddWorker();
  const updateWorkerMutation = useUpdateWorker();
  const deleteWorkerMutation = useDeleteWorker();

  // Check if current user is an admin
  const isAdmin = user?.user_metadata?.user_role === 'admin';
  
  // Check if current user is editing their own profile
  const isOwnProfile = worker?.id === user?.id;

  // Populate form data when in edit mode
  useEffect(() => {
    if (worker) {
      setFormData({
        first_name: worker.first_name,
        last_name: worker.last_name,
        email: worker.email,
        phone: worker.phone || '',
        role: worker.role,
        availability: worker.availability || {},
        active: worker.active !== false, // Default to true if not specified
        user_role: worker.user_role || 'worker'
      });
    } else {
      resetForm();
    }
  }, [worker, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAvailabilityChange = (day: string, timeRange: string, value: string) => {
    setFormData(prev => {
      const newAvailability = { ...prev.availability };
      
      if (!newAvailability[day]) {
        newAvailability[day] = {};
      }
      
      newAvailability[day][timeRange] = value;
      
      return {
        ...prev,
        availability: newAvailability
      };
    });
  };

  const getAvailabilityValue = (day: string, timeRange: string): string => {
    if (!formData.availability || !formData.availability[day]) {
      return '';
    }
    return formData.availability[day][timeRange] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditMode && worker?.id) {
        await updateWorkerMutation.mutateAsync({ 
          id: worker.id, 
          updates: formData 
        });
      } else {
        await addWorkerMutation.mutateAsync(formData);
      }
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled by the mutation and displayed via toast
    }
  };

  const handleDelete = async () => {
    if (!worker?.id) return;
    
    try {
      await deleteWorkerMutation.mutateAsync(worker.id);
      resetForm();
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      // Error is handled by the mutation and displayed via toast
    }
  };

  const handleResetPassword = async () => {
    if (!worker?.id) return;
    
    try {
      await resetWorkerPassword(worker.id);
      setShowResetPasswordConfirm(false);
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
      role: 'Cuidador',
      availability: {},
      active: true,
      user_role: 'worker'
    });
    setErrors({});
    setShowDeleteConfirm(false);
    setShowResetPasswordConfirm(false);
  };

  const isPending = addWorkerMutation.isPending || 
                    updateWorkerMutation.isPending || 
                    deleteWorkerMutation.isPending;

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
                {showDeleteConfirm ? (
                  <div>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Delete Worker
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete this worker? This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                        onClick={handleDelete}
                        disabled={isPending}
                      >
                        {deleteWorkerMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : showResetPasswordConfirm ? (
                  <div>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Reset Password
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to reset this worker's password? They will need to change it on their next login.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 sm:ml-3 sm:w-auto"
                        onClick={handleResetPassword}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={() => setShowResetPasswordConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                          {isEditMode ? 'Edit Worker' : 'Add New Worker'}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Please fill in the worker information below. Fields marked with * are required.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
                      <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                            First Name *
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
                            Last Name *
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
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isEditMode && !isAdmin} // Only admins can change email in edit mode
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.email ? 'border-red-300' : ''
                            } ${isEditMode && !isAdmin ? 'bg-gray-100' : ''}`}
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role *
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.role ? 'border-red-300' : ''
                            }`}
                          >
                            {ROLE_OPTIONS.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          {errors.role && (
                            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                          )}
                        </div>

                        {/* User Role (Admin only) */}
                        {isAdmin && (
                          <div>
                            <label htmlFor="user_role" className="block text-sm font-medium text-gray-700">
                              System Role
                            </label>
                            <select
                              id="user_role"
                              name="user_role"
                              value={formData.user_role}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              {USER_ROLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center">
                            <input
                              id="active"
                              name="active"
                              type="checkbox"
                              checked={formData.active}
                              onChange={handleChange}
                              disabled={isEditMode && isOwnProfile} // Can't deactivate own account
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
                              Active
                            </label>
                          </div>
                          {isEditMode && isOwnProfile && (
                            <p className="mt-1 text-xs text-gray-500">You cannot deactivate your own account.</p>
                          )}
                        </div>

                        <div className="sm:col-span-2 mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
                          <div className="space-y-4">
                            {DAYS_OF_WEEK.map(day => (
                              <div key={day} className="grid grid-cols-3 gap-2">
                                <div className="text-sm font-medium text-gray-700">{day}</div>
                                <div>
                                  <label htmlFor={`${day}-morning`} className="block text-xs text-gray-500">
                                    Morning (8AM-12PM)
                                  </label>
                                  <select
                                    id={`${day}-morning`}
                                    value={getAvailabilityValue(day, 'morning')}
                                    onChange={(e) => handleAvailabilityChange(day, 'morning', e. target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                  >
                                    <option value="">Not Available</option>
                                    <option value="available">Available</option>
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={`${day}-afternoon`} className="block text-xs text-gray-500">
                                    Afternoon (1PM-5PM)
                                  </label>
                                  <select
                                    id={`${day}-afternoon`}
                                    value={getAvailabilityValue(day, 'afternoon')}
                                    onChange={(e) => handleAvailabilityChange(day, 'afternoon', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                  >
                                    <option value="">Not Available</option>
                                    <option value="available">Available</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        >
                          {isPending ? 
                            (isEditMode ? 'Updating...' : 'Adding...') : 
                            (isEditMode ? 'Update Worker' : 'Add Worker')}
                        </button>
                        
                        {isEditMode ? (
                          <div className="mt-3 sm:mt-0 flex space-x-2">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setShowResetPasswordConfirm(true)}
                                className="inline-flex justify-center rounded-md bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 shadow-sm ring-1 ring-inset ring-yellow-300 hover:bg-yellow-100"
                              >
                                Reset Password
                              </button>
                            )}
                            {(isAdmin || !isOwnProfile) && (
                              <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="inline-flex justify-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100"
                              >
                                Delete Worker
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={resetForm}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                          >
                            Clear Fields
                          </button>
                        )}
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}