import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://digwvrfrvfcpcslbndrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3d2cmZydmZjcGNzbGJuZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTY4NDgsImV4cCI6MjA5ODI5Mjg0OH0.hBNkfpV8R3f0bgBli6SIEBPNYMe8Zb7vLT8iDt1Jyq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log("Testing Supabase connection...");
  
  // Try to sign up a test user
  const email = `testuser_${Date.now()}@example.com`;
  const password = "password123";
  console.log(`Signing up with ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) {
    console.error("❌ Sign up failed:", authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log("✅ Signed in as:", userId);
  
  const dummyData = { test: "Hello World", timestamp: new Date().toISOString() };
  
  console.log("Trying to insert data into portMaps...");
  const { data, error } = await supabase
    .from('portMaps')
    .upsert({ id: userId, data: dummyData });
    
  if (error) {
    console.error("❌ Insert Failed:", error);
  } else {
    console.log("✅ Insert Success!");
    
    console.log("Trying to read data back...");
    const { data: readData, error: readError } = await supabase
      .from('portMaps')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (readError) {
      console.error("❌ Read Failed:", readError);
    } else {
      console.log("✅ Read Success:", readData);
    }
  }
}

testSupabase();
