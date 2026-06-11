import { PrismaClient } from '@prisma/client';

const regions = [
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-eu-north-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com'
];

async function testConnection(host) {
  const url = `postgresql://postgres.rumaeeedqobxnlsosuku:Pdn1001199x@${host}:6543/postgres?pgbouncer=true`;
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return true;
  } catch (err) {
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log('Testing regions to find the correct Supabase pooler...');
  for (const host of regions) {
    process.stdout.write(`Testing ${host}... `);
    const success = await testConnection(host);
    if (success) {
      console.log('✅ SUCCESS!');
      console.log(`\nFound correct DATABASE_URL:\npostgresql://postgres.rumaeeedqobxnlsosuku:Pdn1001199x@${host}:6543/postgres?pgbouncer=true`);
      return;
    } else {
      console.log('❌ Failed');
    }
  }
  
  console.log('\nCould not find the pooler automatically. Trying direct connection (IPv6)...');
  const directUrl = `postgresql://postgres:Pdn1001199x@db.rumaeeedqobxnlsosuku.supabase.co:5432/postgres`;
  const directPrisma = new PrismaClient({
    datasources: { db: { url: directUrl } }
  });
  try {
    await directPrisma.$queryRaw`SELECT 1`;
    console.log('✅ SUCCESS using direct connection!');
    console.log(`\nFound correct DATABASE_URL:\n${directUrl}`);
    await directPrisma.$disconnect();
  } catch (e) {
    console.log('❌ Direct connection failed:', e.message);
    await directPrisma.$disconnect();
  }
}

main();
