import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useWorkers } from '../hooks/useWorkers';
import AppointmentModal from '../components/modals/AppointmentModal';
import { Appointment } from '../lib/api/appointmentsApi';

export default function Appointments() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [workerFilter, setWorkerFilter] = useState<string>('');
  const [viewType, setViewType] = useState<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');

  // Fetch workers for filter dropdown
  const { data: workersData } = useWorkers({ active: true });

  // Fetch appointments
  const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', workerFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(first_name, last_name),
          worker:workers(first_name, last_name),
          service:services(name)
        `);
      
      if (workerFilter) {
        query = query.eq('worker_id', workerFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  // Format appointments for calendar
  const events = appointmentsData?.map(appointment => ({
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

  // Handle date click to create new appointment
  const handleDateClick = (info: any) => {
    setSelectedDate(info.date);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  // Handle event click to edit appointment
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    setSelectedAppointment(appointment);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  // Handle worker filter change
  const handleWorkerFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWorkerFilter(e.target.value);
  };

  // Handle view type change
  const handleViewChange = (viewType: 'timeGridWeek' | 'dayGridMonth') => {
    setViewType(viewType);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(viewType);
    }
  };

  // Close modal and refresh data
  const closeModal = () => {
    setIsModalOpen(false);
    refetchAppointments();
    // Small delay to avoid visual glitches
    setTimeout(() => {
      setSelectedAppointment(null);
      setSelectedDate(null);
    }, 200);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all appointments in the calendar.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div>
            <label htmlFor="worker-filter" className="sr-only">Filter by worker</label>
            <select
              id="worker-filter"
              value={workerFilter}
              onChange={handleWorkerFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Workers</option>
              {workersData?.data?.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.first_name} {worker.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-4 py-2 text-sm font-medium ${
                viewType === 'timeGridWeek'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-md`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-4 py-2 text-sm font-medium ${
                viewType === 'dayGridMonth'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-r-md`}
            >
              Month
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedAppointment(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Schedule appointment
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <div className="calendar-container" style={{ height: 'calc(100vh - 250px)' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={events}
            dateClick={handleDateClick}
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
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
          <span className="text-sm text-gray-600">Scheduled</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          <span className="text-sm text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          <span className="text-sm text-gray-600">Cancelled</span>
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        appointment={selectedAppointment}
        selectedDate={selectedDate || undefined}
        selectedWorkerId={selectedWorkerId || workerFilter || undefined}
      />
    </div>
  );
}