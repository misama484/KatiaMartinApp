import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

export default function CalendarDashboard() {
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', selectedWorker, selectedClient],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          worker:workers(first_name, last_name),
          client:clients(first_name, last_name),
          service:services(name)
        `);

      if (selectedWorker) {
        query = query.eq('worker_id', selectedWorker);
      }

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: workersData } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workers').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data || [];
    },
  });

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

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'cancelled':
        return 'red';
      default:
        return 'purple';
    }
  }

  if (appointmentsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mt-8 bg-white overflow-hidden shadow rounded-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Agenda</h2>
        <div className="flex space-x-4">
          <div>
            <label htmlFor="worker-filter" className="sr-only">Filter by worker</label>
            <select
              id="worker-filter"
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Workers</option>
              {workersData?.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.first_name} {worker.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="client-filter" className="sr-only">Filter by client</label>
            <select
              id="client-filter"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Clients</option>
              {clientsData?.map(client => (
                <option key={client.id} value={client.id}>{client.first_name} {client.last_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        eventClick={(info) => {
          const appointment = info.event.extendedProps.appointment;
          alert(`Appointment with ${appointment.client.first_name} ${appointment.client.last_name} for ${appointment.service.name}`);
        }}
      />
    </div>
  );
}