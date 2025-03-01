import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAddAppointment, useUpdateAppointment, useDeleteAppointment } from '../../hooks/useAppointments';
import { useClients } from '../../hooks/useClients';
import { useWorkers } from '../../hooks/useWorkers';
import { useServices } from '../../hooks/useServices';
import { Appointment } from '../../lib/api/appointmentsApi';
import { format, addHours, parseISO, set } from 'date-fns';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null; // If provided, we're in edit mode
  selectedDate?: Date; // If provided, pre-fill the date/time fields
  selectedWorkerId?: string; // If provided, pre-select the worker
}

const APPOINTMENT_STATUS_OPTIONS = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
];

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  appointment, 
  selectedDate,
  selectedWorkerId 
}: AppointmentModalProps) {
  const isEditMode = !!appointment;
  
  const [formData, setFormData] = useState<Omit<Appointment, 'id'>>({
    client_id: '',
    worker_id: '',
    service_id: '',
    start_time: '',
    end_time: '',
    status: 'scheduled',
    notes: '',
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const addAppointmentMutation = useAddAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  // Fetch data for dropdowns
  const { data: clientsData } = useClients();
  const { data: workersData } = useWorkers({ active: true });
  const { data: servicesData } = useServices({ active: true });

  // Initialize form data based on props
  useEffect(() => {
    if (appointment) {
      // Edit mode - populate with existing appointment data
      setFormData({
        client_id: appointment.client_id,
        worker_id: appointment.worker_id,
        service_id: appointment.service_id,
        start_time: format(new Date(appointment.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(appointment.end_time), "yyyy-MM-dd'T'HH:mm"),
        status: appointment.status || 'scheduled',
        notes: appointment.notes || '',
        location: appointment.location
      });
    } else {
      // Create mode - initialize with defaults or selected values
      const startTime = selectedDate 
        ? set(selectedDate, { minutes: Math.floor(selectedDate.getMinutes() / 30) * 30 })
        : set(new Date(), { minutes: Math.floor(new Date().getMinutes() / 30) * 30 });
      
      const endTime = addHours(startTime, 1);
      
      setFormData({
        client_id: '',
        worker_id: selectedWorkerId || '',
        service_id: '',
        start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
        status: 'scheduled',
        notes: '',
        location: 'Client\'s home' // Default location
      });
    }
  }, [appointment, selectedDate, selectedWorkerId, isOpen]);

  // Update end time when service changes (based on duration)
  useEffect(() => {
    if (formData.service_id && formData.start_time) {
      const selectedService = servicesData?.data?.find(
        service => service.id === formData.service_id
      );
      
      if (selectedService?.duration_minutes) {
        const startTime = new Date(formData.start_time);
        const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
        
        setFormData(prev => ({
          ...prev,
          end_time: format(endTime, "yyyy-MM-dd'T'HH:mm")
        }));
      }
    }
  }, [formData.service_id, formData.start_time, servicesData?.data]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }
    
    if (!formData.worker_id) {
      newErrors.worker_id = 'Worker is required';
    }
    
    if (!formData.service_id) {
      newErrors.service_id = 'Service is required';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    
    if (!formData.location) {
      newErrors.location = 'Location is required';
    }
    
    // Validate that end time is after start time
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      
      if (endTime <= startTime) {
        newErrors.end_time = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      if (isEditMode && appointment?.id) {
        await updateAppointmentMutation.mutateAsync({ 
          id: appointment.id, 
          updates: formData 
        });
      } else {
        await addAppointmentMutation.mutateAsync(formData);
      }
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled by the mutation and displayed via toast
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    
    try {
      await deleteAppointmentMutation.mutateAsync(appointment.id);
      resetForm();
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      // Error is handled by the mutation and displayed via toast
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      worker_id: '',
      service_id: '',
      start_time: '',
      end_time: '',
      status: 'scheduled',
      notes: '',
      location: ''
    });
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const isPending = addAppointmentMutation.isPending || 
                    updateAppointmentMutation.isPending || 
                    deleteAppointmentMutation.isPending;

  // Get worker availability for the selected date and worker
  const getWorkerAvailability = () => {
    if (!formData.worker_id || !formData.start_time) return null;
    
    const selectedWorker = workersData?.data?.find(
      worker => worker.id === formData.worker_id
    );
    
    if (!selectedWorker?.availability) return null;
    
    const startDate = new Date(formData.start_time);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][startDate.getDay()];
    const hour = startDate.getHours();
    
    // Determine if morning (8-12) or afternoon (13-17)
    const timeSlot = hour >= 8 && hour < 12 ? 'morning' : hour >= 13 && hour < 17 ? 'afternoon' : null;
    
    if (!timeSlot) return null;
    
    const availability = selectedWorker.availability[dayOfWeek]?.[timeSlot];
    
    return availability === 'available';
  };

  const workerIsAvailable = getWorkerAvailability();

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
                          Cancel Appointment
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to cancel this appointment? This action cannot be undone.
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
                        {deleteAppointmentMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Go Back
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
                          {isEditMode ? 'Edit Appointment' : 'Schedule New Appointment'}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Please fill in the appointment details below. Fields marked with * are required.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
                      <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                            Client *
                          </label>
                          <select
                            id="client_id"
                            name="client_id"
                            value={formData.client_id}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.client_id ? 'border-red-300' : ''
                            }`}
                          >
                            <option value="">Select a client</option>
                            {clientsData?.data?.map(client => (
                              <option key={client.id} value={client.id}>
                                {client.first_name} {client.last_name}
                              </option>
                            ))}
                          </select>
                          {errors.client_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="worker_id" className="block text-sm font-medium text-gray-700">
                            Worker *
                          </label>
                          <select
                            id="worker_id"
                            name="worker_id"
                            value={formData.worker_id}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.worker_id ? 'border-red-300' : ''
                            }`}
                          >
                            <option value="">Select a worker</option>
                            {workersData?.data?.map(worker => (
                              <option key={worker.id} value={worker.id}>
                                {worker.first_name} {worker.last_name} ({worker.role})
                              </option>
                            ))}
                          </select>
                          {errors.worker_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.worker_id}</p>
                          )}
                          {formData.worker_id && formData.start_time && workerIsAvailable === false && (
                            <p className="mt-1 text-sm text-yellow-600">
                              Warning: Worker may not be available at this time based on their schedule.
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="service_id" className="block text-sm font-medium text-gray-700">
                            Service *
                          </label>
                          <select
                            id="service_id"
                            name="service_id"
                            value={formData.service_id}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.service_id ? 'border-red-300' : ''
                            }`}
                          >
                            <option value="">Select a service</option>
                            {servicesData?.data?.map(service => (
                              <option key={service.id} value={service.id}>
                                {service.name} ({service.duration_minutes} min - ${service.base_price})
                              </option>
                            ))}
                          </select>
                          {errors.service_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.service_id}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                            Start Time *
                          </label>
                          <input
                            type="datetime-local"
                            name="start_time"
                            id="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.start_time ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.start_time && (
                            <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                            End Time *
                          </label>
                          <input
                            type="datetime-local"
                            name="end_time"
                            id="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.end_time ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.end_time && (
                            <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                            Location *
                          </label>
                          <input
                            type="text"
                            name="location"
                            id="location"
                            value={formData.location}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.location ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.location && (
                            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            {APPOINTMENT_STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        >
                          {isPending ? 
                            (isEditMode ? 'Updating...' : 'Scheduling...') : 
                            (isEditMode ? 'Update Appointment' : 'Schedule Appointment')}
                        </button>
                        {isEditMode ? (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 sm:col-start-1 sm:mt-0"
                          >
                            Cancel Appointment
                          </button>
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