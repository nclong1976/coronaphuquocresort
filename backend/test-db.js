import postgres from 'postgres';
const sql = postgres('postgresql://postgres:Pdn1001199x@db.ilhzsadfwezqljvrbpwt.supabase.co:5432/postgres');
sql`SELECT 1 as result`.then(console.log).catch(console.error).finally(()=>process.exit());
