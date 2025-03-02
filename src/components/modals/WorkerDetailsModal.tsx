import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface WorkerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
}

export default function WorkerDetailsModal({ 
  isOpen, 
  onClose, 
  workerId,
  workerName
}: WorkerDetailsModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tooltipContent, setTooltipContent] = useState<{
    visible: boolean;
    content: React.ReactNode;
    position: { x: number; y: number };
  }>({
    visible: false,
    content: null,
    position: { x: 0, y: 0 }
  });

  // Fetch worker's appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['worker-appointments', workerId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(first_name, last_name),
          service:services(name, duration_minutes, base_price)
        `)
        .eq('worker_id', workerId);
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('start_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!workerId,
  });

  // Format appointments for calendar
  const calendarEvents = appointmentsData?.map(appointment => ({
    id: appointment.id,
    title: `${appointment.client.first_name} ${appointment.client.last_name} - ${appointment.service.name}`,
    start: appointment.start_time,
    end: appointment.end_time,
    extendedProps: {
      appointment: appointment
    },
    backgroundColor: getStatusColor(appointment.status),
    borderColor: getStatusColor(appointment.status)
  })) || [];

  // Helper function to get color based on status
  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return '#10B981'; // green
      case 'in_progress':
        return '#3B82F6'; // blue
      case 'cancelled':
        return '#EF4444'; // red
      default:
        return '#8B5CF6'; // purple (scheduled)
    }
  }

  // Handle event click to show tooltip
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    const rect = info.el.getBoundingClientRect();
    
    setTooltipContent({
      visible: true,
      content: (
        <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
          <h4 className="font-semibold">{appointment.service.name}</h4>
          <p className="text-sm">Client: {appointment.client.first_name} {appointment.client.last_name}</p>
          <p className="text-sm">Time: {format(new Date(appointment.start_time), 'h:mm a')} - {format(new Date(appointment.end_time), 'h:mm a')}</p>
          <p className="text-sm">Location: {appointment.location}</p>
          <p className="text-sm">Status: {appointment.status}</p>
        </div>
      ),
      position: {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY
      }
    });
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTooltipContent(prev => ({ ...prev, visible: false }));
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Close tooltip when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTooltipContent(prev => ({ ...prev, visible: false }));
    }
  }, [isOpen]);

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
                      {workerName}'s Details
                    </Dialog.Title>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Weekly Schedule</h4>
                    <div>
                      <label htmlFor="status-filter" className="sr-only">Filter by status</label>
                      <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow mb-6" style={{ height: '400px' }}>
                    {appointmentsLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <FullCalendar
                        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: ''
                        }}
                        events={calendarEvents}
                        eventClick={handleEventClick}
                        slotMinTime="08:00:00"
                        slotMaxTime="20:00:00"
                        allDaySlot={false}
                        height="100%"
                        slotDuration="00:30:00"
                        nowIndicator={true}
                        businessHours={{
                          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                          startTime: '08:00',
                          endTime: '18:00',
                        }}
                      />
                    )}
                  </div>

                  <h4 className="text-md font-medium text-gray-900 mb-4">Services Performed</h4>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Service
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Client
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Date
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {appointmentsData?.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-sm text-gray-500">
                              No services found for this worker.
                            </td>
                          </tr>
                        ) : (
                          appointmentsData?.map((appointment) => (
                            <tr key={appointment.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {appointment.service.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {appointment.client.first_name} {appointment.client.last_name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {format(new Date(appointment.start_time), 'PPp')}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  appointment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {tooltipContent.visible && (
                  <div 
                    className="absolute z-50"
                    style={{
                      left: `${tooltipContent.position.x}px`,
                      top: `${tooltipContent.position.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {tooltipContent.content}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}