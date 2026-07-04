const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://digwvrfrvfcpcslbndrd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3d2cmZydmZjcGNzbGJuZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTY4NDgsImV4cCI6MjA5ODI5Mjg0OH0.hBNkfpV8R3f0bgBli6SIEBPNYMe8Zb7vLT8iDt1Jyq4';
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

client.from('portMaps').select('*').then(res => {
    console.log("portMaps:", JSON.stringify(res.data).substring(0, 500));
    console.log("error:", res.error);
});
client.from('che_equipment').select('*').then(res => {
    console.log("che_equipment count:", res.data ? res.data.length : 0);
    console.log("error:", res.error);
});
