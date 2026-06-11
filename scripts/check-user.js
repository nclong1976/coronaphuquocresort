import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rumaeeedqobxnlsosuku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWFlZWVkcW9ieG5sc29zdWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NDU2OSwiZXhwIjoyMDk2MzQwNTY5fQ.dXUR4mn7kw7oDjXqHdkY1HL9vwD1GeqlVWqruXUGB4I';

const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: users, error } = await sb.from('User').select('*').or('username.eq.leo1102,email.eq.leo1102');
    if (error) {
      console.error('Database query error:', error);
      return;
    }
    console.log('Found users:', users);
  } catch (err) {
    console.error('Exception:', err);
  }
}
check();
