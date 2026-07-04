import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase
const supabaseUrl = 'https://digwvrfrvfcpcslbndrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3d2cmZydmZjcGNzbGJuZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTY4NDgsImV4cCI6MjA5ODI5Mjg0OH0.hBNkfpV8R3f0bgBli6SIEBPNYMe8Zb7vLT8iDt1Jyq4';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Đăng ký bằng Email
export const signUpWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error) throw error;
  return data;
};

// Đăng nhập bằng Email
export const loginWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) throw error;
  return data;
};

// Đăng xuất
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Lỗi đăng xuất:", error);
};

// Lưu dữ liệu bản đồ
export const saveMapData = async (userId, data) => {
  const { error } = await supabase
    .from('portMaps')
    .upsert({ id: userId, data: data });
  if (error) throw error;
};

// Tải dữ liệu bản đồ
export const loadMapData = async (userId) => {
  const { data, error } = await supabase
    .from('portMaps')
    .select('data')
    .eq('id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data?.data || null;
};

// Lưu dữ liệu CHE (Supabase)
export const syncCheData = async (cheList) => {
  const { error } = await supabase
    .from('che_equipment')
    .upsert(cheList);
  if (error) throw error;
};

// Tải dữ liệu CHE (Supabase)
export const loadCheData = async () => {
  const { data, error } = await supabase
    .from('che_equipment')
    .select('*');
  if (error) throw error;
  return data;
};

// Tải dữ liệu CHE cục bộ (Fallback)
export const loadLocalCheData = async () => {
   const response = await fetch('./dummy_che_data.json');
   const data = await response.json();
   return data;
};

// Lưu dữ liệu Xe tải (Supabase)
export const syncTruckData = async (truckList) => {
  const { error } = await supabase
    .from('vehicles')
    .upsert(truckList);
  if (error) throw error;
};

// Tải dữ liệu Xe tải cục bộ (Fallback)
export const loadLocalTruckData = async () => {
   const response = await fetch('./dummy_vehicles.json');
   const data = await response.json();
   return data;
};
