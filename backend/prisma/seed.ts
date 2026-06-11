import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ensureWallet, executeLedgerEntry } from '../src/ledger/walletService.js';
import { ensureGameConfigs } from '../src/services/gameConfigService.js';

const prisma = new PrismaClient();

async function upsertUser(data: { email: string; username: string; fullName: string; role: string; passwordHash: string }) {
  // Try finding by email first
  let existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (!existing) {
    // Try finding by username
    existing = await prisma.user.findUnique({ where: { username: data.username } });
  }
  
  if (existing) {
    console.log(`[Seed] User ${data.username} already exists. Updating...`);
    return await prisma.user.update({
      where: { id: existing.id },
      data: { 
        email: data.email,
        password: data.passwordHash, 
        fullName: data.fullName, 
        role: data.role 
      },
    });
  }
  
  console.log(`[Seed] Creating user ${data.username}...`);
  return await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      password: data.passwordHash,
      role: data.role,
    },
  });
}

async function main() {
  await ensureGameConfigs();

  const hash = await bcrypt.hash('password123', 12);
  const user = await upsertUser({
    email: 'test@casino.com',
    username: 'testuser',
    fullName: 'Test User',
    passwordHash: hash,
    role: 'user',
  });

  const superHash = await bcrypt.hash('121212', 12);
  const superAdmin = await upsertUser({
    email: 'leo1102@casino.com',
    username: 'leo1102',
    fullName: 'Super Admin',
    passwordHash: superHash,
    role: 'super_admin',
  });

  const staffHash = await bcrypt.hash('456789', 12);
  const staffAdmin = await upsertUser({
    email: 'admin1@casino.com',
    username: 'admin1',
    fullName: 'Admin CSKH',
    passwordHash: staffHash,
    role: 'admin',
  });

  await ensureWallet(user.id);
  await ensureWallet(superAdmin.id);
  await ensureWallet(staffAdmin.id);
  
  // Check if initial balance is already deposited
  const balance = await prisma.transaction.findMany({
    where: { userId: user.id, type: 'deposit' }
  });
  
  if (balance.length === 0) {
    const r = await executeLedgerEntry({
      userId: user.id,
      type: 'deposit',
      amount: 1000,
      metadata: { source: 'seed', note: 'Initial test balance' },
    });
    if (!r.success) throw new Error(r.error);
    console.log('[Seed] Initial balance of 1000 deposited for testuser.');
  }

  console.log('Seed OK.');
  console.log('  User: testuser (test@casino.com) / password123, balance: 1000');
  console.log('  Super admin: leo1102 / 121212');
  console.log('  Admin CSKH: admin1 / 456789');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
