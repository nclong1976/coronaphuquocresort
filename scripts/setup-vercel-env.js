import { execSync } from 'child_process';

const envs = [
  { name: 'SUPABASE_URL', value: 'https://rumaeeedqobxnlsosuku.supabase.co' },
  { name: 'SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWFlZWVkcW9ieG5sc29zdWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjQ1NjksImV4cCI6MjA5NjM0MDU2OX0.KyWo3ShGc1zv6MpIQnaraBt9NgwXlGsgmIIAwubuO-c' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bWFlZWVkcW9ieG5sc29zdWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2NDU2OSwiZXhwIjoyMDk2MzQwNTY5fQ.dXUR4mn7kw7oDjXqHdkY1HL9vwD1GeqlVWqruXUGB4I' },
  { name: 'DATABASE_URL', value: 'postgresql://postgres:Pdn1001199x@db.rumaeeedqobxnlsosuku.supabase.co:5432/postgres' },
  { name: 'JWT_SECRET', value: 'corona-phuquoc-casino-jwt-secret-2026-super-secure-key-min32chars' },
  { name: 'JWT_EXPIRES_IN', value: '7d' },
  { name: 'NODE_ENV', value: 'production' }
];

console.log('[VercelEnvSetup] Starting sequential environment variable setup...');

for (const env of envs) {
  console.log(`[VercelEnvSetup] Adding ${env.name}...`);
  try {
    // Sử dụng Vercel CLI cục bộ
    const cmd = `npx vercel env add ${env.name} production --value "${env.value}" --yes --force`;
    const output = execSync(cmd, { stdio: 'pipe' }).toString();
    console.log(`[VercelEnvSetup] Success: ${env.name}`);
    console.log(output.trim().split('\n').map(line => `  > ${line}`).join('\n'));
  } catch (error) {
    console.error(`[VercelEnvSetup] Failed to add ${env.name}:`, error.message);
    if (error.stdout) console.error('stdout:', error.stdout.toString());
    if (error.stderr) console.error('stderr:', error.stderr.toString());
  }
}

console.log('[VercelEnvSetup] Done.');
