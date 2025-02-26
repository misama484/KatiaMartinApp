/*
  # Initial Schema for Elderly Care Management System

  1. New Tables
    - `workers`
      - Basic information about care workers
      - Availability tracking
      - Contact details
    - `clients`
      - Client information and preferences
    - `appointments`
      - Scheduling information
      - Links workers with clients
      - Status tracking
    - `services`
      - Available service types
      - Associated costs
    - `invoices`
      - Billing information
      - Payment status tracking
    
  2. Security
    - Enable RLS on all tables
    - Policies for authenticated access
*/

-- Create custom types
CREATE TYPE appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'cancelled');

-- Workers table
CREATE TABLE workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL,
  availability jsonb DEFAULT '{}',
  active boolean DEFAULT true
);

-- Clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text NOT NULL,
  address text NOT NULL,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text
);

-- Services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  base_price decimal(10,2) NOT NULL,
  active boolean DEFAULT true
);

-- Appointments table
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  worker_id uuid REFERENCES workers(id) NOT NULL,
  service_id uuid REFERENCES services(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes text,
  location text NOT NULL
);

-- Invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  appointment_id uuid REFERENCES appointments(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  status invoice_status DEFAULT 'draft',
  due_date date NOT NULL,
  paid_date date,
  notes text
);

-- Enable Row Level Security
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated full access to workers" ON workers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to services" ON services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to appointments" ON appointments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to invoices" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_appointments_worker_id ON appointments(worker_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();