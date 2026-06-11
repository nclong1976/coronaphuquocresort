import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    console.log('Testing Prisma connection...');
    const result = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
    console.log('✅ Connected! Tables found:');
    console.log(result);
    
    const gameConfigs = await prisma.gameConfig.findMany({ select: { gameId: true, enabled: true } });
    console.log('\nGame configs:', gameConfigs.length, 'rows');
    gameConfigs.forEach(g => console.log(' -', g.gameId, g.enabled ? '✅' : '❌'));
  } catch (e) {
    console.error('❌ Connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
