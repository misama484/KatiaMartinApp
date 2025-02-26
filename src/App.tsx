import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Clients from './pages/Clients';
import Appointments from './pages/Appointments';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workers" element={<Workers />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/invoices" element={<Invoices />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;