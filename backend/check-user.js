import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rumaeeedqobxnlsosuku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWFlZWVkcW9ieG5sc29zdWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NDU2OSwiZXhwIjoyMDk2MzQwNTY5fQ.dXUR4mn7kw7oDjXqHdkY1HL9vwD1GeqlVWqruXUGB4I';

const sb = createClient(supabaseUrl, supabaseKey);

async function setBalance() {
  try {
    const { data: user } = await sb.from('User').select('*').eq('username', 'testuser').single();
    if (!user) {
      console.log('User testuser not found');
      return;
    }
    const { data: wallet, error } = await sb.from('Wallet').update({ balance: 50000 }).eq('userId', user.id).select().single();
    if (error) {
      console.error('Update error:', error);
      return;
    }
    console.log('Wallet updated successfully:', wallet);
  } catch (err) {
    console.error('Exception:', err);
  }
}
setBalance();
