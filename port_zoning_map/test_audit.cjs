const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://digwvrfrvfcpcslbndrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3d2cmZydmZjcGNzbGJuZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTY4NDgsImV4cCI6MjA5ODI5Mjg0OH0.hBNkfpV8R3f0bgBli6SIEBPNYMe8Zb7vLT8iDt1Jyq4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('AuditLogs').select('*').limit(5);
  if (error) {
    console.log("DB ERROR:", error);
  } else {
    console.log("SUCCESS. Row count:", data.length);
    console.log("Data:", JSON.stringify(data, null, 2));
  }
}
check();
