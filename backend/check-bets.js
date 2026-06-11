import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rumaeeedqobxnlsosuku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWFlZWVkcW9ieG5sc29zdWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NDU2OSwiZXhwIjoyMDk2MzQwNTY5fQ.dXUR4mn7kw7oDjXqHdkY1HL9vwD1GeqlVWqruXUGB4I';

const sb = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = '4a5f58d1-a4a4-414d-8a55-27d6514d5620';
  const { data: bets } = await sb.from('Bet').select('*').eq('userId', userId).order('createdAt', { ascending: false });
  console.log('Bets for user:');
  for (const b of bets || []) {
    console.log(`- Bet ID: ${b.id} | Round: ${b.roundId} | Amount: $${b.betAmount} | Payout: $${b.payout} | Result: ${b.result} | BetData: ${JSON.stringify(b.betData)}`);
  }
}
main();
