-- Emergency Dispatch System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    emergency_contacts TEXT[] DEFAULT '{}',
    medical_history TEXT[] DEFAULT '{}',
    insurance_provider TEXT,
    insurance_number TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialties TEXT[] NOT NULL,
    total_beds INTEGER NOT NULL DEFAULT 0,
    available_beds INTEGER NOT NULL DEFAULT 0,
    icu_beds INTEGER NOT NULL DEFAULT 0,
    emergency_beds INTEGER NOT NULL DEFAULT 0,
    cost_level TEXT CHECK (cost_level IN ('low', 'medium', 'high', 'premium')) DEFAULT 'medium',
    insurance_accepted TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.0,
    wait_time INTEGER DEFAULT 0, -- in minutes
    location GEOGRAPHY(POINT, 4326),
    status TEXT CHECK (status IN ('available', 'limited', 'full')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ambulances table
CREATE TABLE IF NOT EXISTS ambulances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_number TEXT UNIQUE NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    paramedic_name TEXT NOT NULL,
    paramedic_phone TEXT NOT NULL,
    current_location GEOGRAPHY(POINT, 4326),
    status TEXT CHECK (status IN ('available', 'busy', 'offline', 'maintenance')) DEFAULT 'available',
    equipment TEXT[] DEFAULT '{}',
    capacity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency requests table
CREATE TABLE IF NOT EXISTS emergency_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    destination_location TEXT,
    symptoms TEXT NOT NULL,
    triage_level INTEGER CHECK (triage_level BETWEEN 1 AND 5) NOT NULL,
    urgency_score INTEGER CHECK (urgency_score BETWEEN 0 AND 100) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'dispatched', 'enroute', 'arrived', 'completed', 'cancelled')) DEFAULT 'pending',
    ambulance_id UUID REFERENCES ambulances(id),
    hospital_id UUID REFERENCES hospitals(id),
    photos TEXT[] DEFAULT '{}',
    voice_notes TEXT[] DEFAULT '{}',
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10,2),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'waived')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI assessments table
CREATE TABLE IF NOT EXISTS ai_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    symptoms TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    triage_level INTEGER CHECK (triage_level BETWEEN 1 AND 5) NOT NULL,
    urgency_score INTEGER CHECK (urgency_score BETWEEN 0 AND 100) NOT NULL,
    ai_confidence DECIMAL(5,2) CHECK (ai_confidence BETWEEN 0 AND 100) NOT NULL,
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video calls table
CREATE TABLE IF NOT EXISTS video_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    emergency_request_id UUID REFERENCES emergency_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ambulance_id UUID REFERENCES ambulances(id),
    call_type TEXT CHECK (call_type IN ('emergency', 'consultation')) NOT NULL,
    status TEXT CHECK (status IN ('connecting', 'connected', 'ended', 'failed')) DEFAULT 'connecting',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    notes TEXT
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_requests_user_id ON emergency_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_created_at ON emergency_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_location ON ambulances USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_hospitals_available_beds ON hospitals(available_beds);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_user_id ON ai_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_created_at ON ai_assessments(created_at);

-- Create spatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_ambulances_location_spatial ON ambulances USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_hospitals_location_spatial ON hospitals USING GIST(location);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Emergency requests policies
CREATE POLICY "Users can view own emergency requests" ON emergency_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own emergency requests" ON emergency_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency requests" ON emergency_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- AI assessments policies
CREATE POLICY "Users can view own AI assessments" ON ai_assessments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI assessments" ON ai_assessments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Video calls policies
CREATE POLICY "Users can view own video calls" ON video_calls
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own video calls" ON video_calls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video calls" ON video_calls
    FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for hospitals and ambulances (for availability checking)
CREATE POLICY "Public can view hospitals" ON hospitals
    FOR SELECT USING (true);

CREATE POLICY "Public can view ambulances" ON ambulances
    FOR SELECT USING (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_requests_updated_at BEFORE UPDATE ON emergency_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambulances_updated_at BEFORE UPDATE ON ambulances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lng1, lat1)::geography,
        ST_MakePoint(lng2, lat2)::geography
    ) / 1000; -- Convert to kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to find nearest available ambulance
CREATE OR REPLACE FUNCTION find_nearest_ambulance(
    pickup_lat DECIMAL,
    pickup_lng DECIMAL,
    max_distance_km DECIMAL DEFAULT 10
) RETURNS TABLE (
    id UUID,
    vehicle_number TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    paramedic_name TEXT,
    paramedic_phone TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.vehicle_number,
        a.driver_name,
        a.driver_phone,
        a.paramedic_name,
        a.paramedic_phone,
        ST_Distance(a.current_location, ST_MakePoint(pickup_lng, pickup_lat)::geography) / 1000 as distance_km
    FROM ambulances a
    WHERE a.status = 'available'
    AND ST_DWithin(
        a.current_location,
        ST_MakePoint(pickup_lng, pickup_lat)::geography,
        max_distance_km * 1000
    )
    ORDER BY a.current_location <-> ST_MakePoint(pickup_lng, pickup_lat)::geography
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to find suitable hospitals
CREATE OR REPLACE FUNCTION find_suitable_hospitals(
    required_specialties TEXT[],
    insurance TEXT DEFAULT NULL,
    max_distance_km DECIMAL DEFAULT 50
) RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    phone TEXT,
    specialties TEXT[],
    available_beds INTEGER,
    cost_level TEXT,
    rating DECIMAL,
    wait_time INTEGER,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.address,
        h.phone,
        h.specialties,
        h.available_beds,
        h.cost_level,
        h.rating,
        h.wait_time,
        ST_Distance(h.location, ST_MakePoint(0, 0)::geography) / 1000 as distance_km
    FROM hospitals h
    WHERE h.available_beds > 0
    AND h.status != 'full'
    AND (required_specialties IS NULL OR h.specialties && required_specialties)
    AND (insurance IS NULL OR insurance = ANY(h.insurance_accepted))
    ORDER BY h.available_beds DESC, h.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO hospitals (name, address, phone, specialties, total_beds, available_beds, icu_beds, emergency_beds, cost_level, insurance_accepted, rating, wait_time, location) VALUES
('Dhaka Medical College Hospital', 'Ramna, Dhaka-1000, Bangladesh', '+880-2-8626812', ARRAY['Emergency', 'Trauma', 'Cardiology', 'Neurology', 'Surgery'], 2000, 45, 8, 12, 'low', ARRAY['Government', 'BUPA', 'MetLife', 'Pragati', 'Green Delta'], 4.6, 15, ST_MakePoint(90.3742, 23.7461)),
('Square Hospital Limited', '18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka-1205', '+880-2-8159457', ARRAY['Cardiology', 'Oncology', 'Orthopedics', 'ICU', 'Emergency'], 650, 23, 5, 8, 'high', ARRAY['BUPA', 'MetLife', 'Pragati', 'Green Delta', 'Eastland', 'Prime Islami'], 4.8, 20, ST_MakePoint(90.3944, 23.7515)),
('United Hospital Limited', 'Plot 15, Road 71, Gulshan-2, Dhaka-1212', '+880-2-8836000', ARRAY['Cardiology', 'Neurology', 'Emergency', 'ICU', 'Oncology'], 500, 18, 6, 7, 'high', ARRAY['BUPA', 'MetLife', 'Pragati', 'Green Delta', 'Eastland', 'Prime Islami', 'Reliance'], 4.7, 25, ST_MakePoint(90.4078, 23.7925)),
('Apollo Hospitals Dhaka', 'Plot 81, Block E, Bashundhara R/A, Dhaka-1229', '+880-2-8401661', ARRAY['Cardiology', 'Oncology', 'Transplant', 'Emergency', 'Neurology'], 670, 31, 9, 11, 'premium', ARRAY['BUPA', 'MetLife', 'Pragati', 'Green Delta', 'Eastland', 'Prime Islami', 'Reliance', 'Sadharan'], 4.9, 18, ST_MakePoint(90.4370, 23.8103));

INSERT INTO ambulances (vehicle_number, driver_name, driver_phone, paramedic_name, paramedic_phone, current_location, status, equipment, capacity) VALUES
('AMB-001', 'Abdul Rahman', '+880-1712345678', 'Dr. Fatima Khan', '+880-1812345678', ST_MakePoint(90.3742, 23.7461), 'available', ARRAY['Defibrillator', 'Oxygen Tank', 'Stretcher'], 2),
('AMB-002', 'Mohammed Ali', '+880-1723456789', 'Dr. Sarah Ahmed', '+880-1823456789', ST_MakePoint(90.3944, 23.7515), 'available', ARRAY['Defibrillator', 'Oxygen Tank', 'Stretcher', 'ECG Machine'], 2),
('AMB-003', 'Hassan Khan', '+880-1734567890', 'Dr. Aisha Rahman', '+880-1834567890', ST_MakePoint(90.4078, 23.7925), 'available', ARRAY['Defibrillator', 'Oxygen Tank', 'Stretcher'], 2),
('AMB-004', 'Rashid Ahmed', '+880-1745678901', 'Dr. Zara Khan', '+880-1845678901', ST_MakePoint(90.4370, 23.8103), 'busy', ARRAY['Defibrillator', 'Oxygen Tank', 'Stretcher', 'Ventilator'], 2);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES
('emergency-photos', 'emergency-photos', true),
('voice-notes', 'voice-notes', true);

-- Storage policies
CREATE POLICY "Users can upload emergency photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'emergency-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view emergency photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'emergency-photos');

CREATE POLICY "Users can upload voice notes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view voice notes" ON storage.objects
    FOR SELECT USING (bucket_id = 'voice-notes'); 