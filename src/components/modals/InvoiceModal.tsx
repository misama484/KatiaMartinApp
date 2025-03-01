import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAddInvoice, useUpdateInvoice, useDeleteInvoice } from '../../hooks/useInvoices';
import { useClients } from '../../hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../lib/api/invoicesApi';
import { format, addDays } from 'date-fns';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null; // If provided, we're in edit mode
}

const INVOICE_STATUS_OPTIONS = [
  'draft',
  'pending',
  'paid',
  'cancelled'
];

export default function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const isEditMode = !!invoice;
  
  const [formData, setFormData] = useState<Omit<Invoice, 'id'>>({
    client_id: '',
    appointment_id: '',
    amount: 0,
    status: 'draft',
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'), // Default due date: 30 days from now
    paid_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const addInvoiceMutation = useAddInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  // Fetch clients for dropdown
  const { data: clientsData } = useClients();

  // Fetch appointments for the selected client
  const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments-for-invoice', formData.client_id],
    queryFn: async () => {
      if (!formData.client_id) return { data: [] };
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name, base_price)
        `)
        .eq('client_id', formData.client_id)
        .eq('status', 'completed')
        .is('invoices', null) // Only appointments without invoices
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return { data: data || [] };
    },
    enabled: !!formData.client_id && !isEditMode, // Only fetch when client is selected and not in edit mode
  });

  // Populate form data when in edit mode
  useEffect(() => {
    if (invoice) {
      setFormData({
        client_id: invoice.client_id,
        appointment_id: invoice.appointment_id,
        amount: invoice.amount,
        status: invoice.status || 'draft',
        due_date: format(new Date(invoice.due_date), 'yyyy-MM-dd'),
        paid_date: invoice.paid_date ? format(new Date(invoice.paid_date), 'yyyy-MM-dd') : '',
        notes: invoice.notes || ''
      });
    } else {
      // Reset form for new invoice
      setFormData({
        client_id: '',
        appointment_id: '',
        amount: 0,
        status: 'draft',
        due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        paid_date: '',
        notes: ''
      });
    }
  }, [invoice, isOpen]);

  // Update amount when appointment changes
  useEffect(() => {
    if (formData.appointment_id && !isEditMode) {
      const selectedAppointment = appointmentsData?.data?.find(
        appointment => appointment.id === formData.appointment_id
      );
      
      if (selectedAppointment?.service?.base_price) {
        setFormData(prev => ({
          ...prev,
          amount: selectedAppointment.service.base_price
        }));
      }
    }
  }, [formData.appointment_id, appointmentsData?.data, isEditMode]);

  // Refetch appointments when client changes
  useEffect(() => {
    if (formData.client_id && !isEditMode) {
      refetchAppointments();
      // Clear appointment selection when client changes
      setFormData(prev => ({
        ...prev,
        appointment_id: '',
        amount: 0
      }));
    }
  }, [formData.client_id, refetchAppointments, isEditMode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }
    
    if (!formData.appointment_id) {
      newErrors.appointment_id = 'Appointment is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    
    // If status is paid, paid_date is required
    if (formData.status === 'paid' && !formData.paid_date) {
      newErrors.paid_date = 'Paid date is required when status is paid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
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
    
    // If status changes to paid, set paid_date to today if not already set
    if (name === 'status' && value === 'paid' && !formData.paid_date) {
      setFormData(prev => ({
        ...prev,
        paid_date: format(new Date(), 'yyyy-MM-dd')
      }));
    }
    
    // If status changes from paid, clear paid_date
    if (name === 'status' && value !== 'paid') {
      setFormData(prev => ({
        ...prev,
        paid_date: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditMode && invoice?.id) {
        await updateInvoiceMutation.mutateAsync({ 
          id: invoice.id, 
          updates: formData 
        });
      } else {
        await addInvoiceMutation.mutateAsync(formData);
      }
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled by the mutation and displayed via toast
    }
  };

  const handleDelete = async () => {
    if (!invoice?.id) return;
    
    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
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
      appointment_id: '',
      amount: 0,
      status: 'draft',
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      paid_date: '',
      notes: ''
    });
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const isPending = addInvoiceMutation.isPending || 
                    updateInvoiceMutation.isPending || 
                    deleteInvoiceMutation.isPending;

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
                          Delete Invoice
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete this invoice? This action cannot be undone.
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
                        {deleteInvoiceMutation.isPending ? 'Deleting...' : 'Delete'}
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
                          {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Please fill in the invoice details below. Fields marked with * are required.
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
                            disabled={isEditMode} // Can't change client in edit mode
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.client_id ? 'border-red-300' : ''
                            } ${isEditMode ? 'bg-gray-100' : ''}`}
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
                          <label htmlFor="appointment_id" className="block text-sm font-medium text-gray-700">
                            Appointment *
                          </label>
                          <select
                            id="appointment_id"
                            name="appointment_id"
                            value={formData.appointment_id}
                            onChange={handleChange}
                            disabled={isEditMode || !formData.client_id} // Can't change appointment in edit mode or if no client selected
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.appointment_id ? 'border-red-300' : ''
                            } ${isEditMode || !formData.client_id ? 'bg-gray-100' : ''}`}
                          >
                            <option value="">Select an appointment</option>
                            {appointmentsData?.data?.map(appointment => (
                              <option key={appointment.id} value={appointment.id}>
                                {format(new Date(appointment.start_time), 'PPp')} - {appointment.service.name}
                              </option>
                            ))}
                            {appointmentsData?.data?.length === 0 && formData.client_id && (
                              <option value="" disabled>No eligible appointments found</option>
                            )}
                          </select>
                          {errors.appointment_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.appointment_id}</p>
                          )}
                          {formData.client_id && appointmentsData?.data?.length === 0 && (
                            <p className="mt-1 text-sm text-yellow-600">
                              No completed appointments without invoices found for this client.
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Amount ($) *
                          </label>
                          <input
                            type="number"
                            name="amount"
                            id="amount"
                            step="0.01"
                            min="0"
                            value={formData.amount}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.amount ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
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
                            {INVOICE_STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                            Due Date *
                          </label>
                          <input
                            type="date"
                            name="due_date"
                            id="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.due_date ? 'border-red-300' : ''
                            }`}
                          />
                          {errors.due_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="paid_date" className="block text-sm font-medium text-gray-700">
                            Paid Date {formData.status === 'paid' && '*'}
                          </label>
                          <input
                            type="date"
                            name="paid_date"
                            id="paid_date"
                            value={formData.paid_date}
                            onChange={handleChange}
                            disabled={formData.status !== 'paid'}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              errors.paid_date ? 'border-red-300' : ''
                            } ${formData.status !== 'paid' ? 'bg-gray-100' : ''}`}
                          />
                          {errors.paid_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.paid_date}</p>
                          )}
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
                            (isEditMode ? 'Updating...' : 'Creating...') : 
                            (isEditMode ? 'Update Invoice' : 'Create Invoice')}
                        </button>
                        {isEditMode ? (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 sm:col-start-1 sm:mt-0"
                          >
                            Delete Invoice
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

