-- Chạy lệnh này trong SQL Editor của Supabase

-- Tạo bảng Xe Nâng (CHE)
CREATE TABLE public.che_equipment (
    id text primary key,
    type text not null,
    status text default 'idle'
);

-- Tạo bảng Xe tải (Vehicles)
CREATE TABLE public.vehicles (
    id text primary key,
    license_plate text,
    type text default 'truck',
    status text default 'idle'
);
