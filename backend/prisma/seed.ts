import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ensureWallet, executeLedgerEntry } from '../src/ledger/walletService';
import { ensureGameConfigs } from '../src/services/gameConfigService';

const prisma = new PrismaClient();

async function main() {
  await ensureGameConfigs();

  const hash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@casino.com' },
    update: { password: hash },
    create: {
      email: 'test@casino.com',
      username: 'testuser',
      fullName: 'Test User',
      password: hash,
      role: 'user',
    },
  });

  const superHash = await bcrypt.hash('121212', 12);
  const superAdmin = await prisma.user.upsert({
    where: { username: 'leo1102' },
    update: {
      email: 'leo1102@casino.com',
      password: superHash,
      fullName: 'Super Admin',
      role: 'super_admin',
    },
    create: {
      email: 'leo1102@casino.com',
      username: 'leo1102',
      fullName: 'Super Admin',
      password: superHash,
      role: 'super_admin',
    },
  });

  const staffHash = await bcrypt.hash('456789', 12);
  const staffAdmin = await prisma.user.upsert({
    where: { username: 'admin1' },
    update: {
      email: 'admin1@casino.com',
      password: staffHash,
      fullName: 'Admin CSKH',
      role: 'admin',
    },
    create: {
      email: 'admin1@casino.com',
      username: 'admin1',
      fullName: 'Admin CSKH',
      password: staffHash,
      role: 'admin',
    },
  });

  await ensureWallet(user.id);
  await ensureWallet(superAdmin.id);
  await ensureWallet(staffAdmin.id);
  const r = await executeLedgerEntry({
    userId: user.id,
    type: 'deposit',
    amount: 1000,
    metadata: { source: 'seed', note: 'Initial test balance' },
  });
  if (!r.success) throw new Error(r.error);

  console.log('Seed OK.');
  console.log('  User: test@casino.com / password123, balance: 1000');
  console.log('  Super admin: leo1102 / 121212');
  console.log('  Admin CSKH: admin1 / 456789');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
