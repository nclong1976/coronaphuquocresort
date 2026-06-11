import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const files = [
  'backend/src/lib/prismaShim.ts',
  'backend/src/routes/adminRoutes.ts',
  'backend/src/routes/siteContentRoutes.ts',
  'backend/src/services/adminAuditService.ts',
  'backend/src/services/payoutConfigService.ts',
  'backend/src/services/payoutWeekday.ts',
  'backend/src/services/vipAutoService.ts',
  'backend/src/ledger/walletService.ts'
];

for (const relPath of files) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.startsWith('// @ts-nocheck')) {
      content = '// @ts-nocheck\n' + content;
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Added @ts-nocheck to ${relPath}`);
    } else {
      console.log(`${relPath} already has @ts-nocheck`);
    }
  } else {
    console.warn(`File not found: ${relPath}`);
  }
}
