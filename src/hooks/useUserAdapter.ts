import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

/**
 * Adapts API user to the shape expected by existing UI components.
 * Balance comes from centralized WalletContext (server-synced).
 */
export function useUserAdapter() {
  const { user } = useAuth();
  const { balance } = useWallet();
  if (!user) return null;
  const bankName = (user as any).bankName;
  const bankAccountNumber = (user as any).bankAccountNumber;
  const hasBankCard = !!(bankName && bankAccountNumber);
  const totalDeposit = (user as any).totalDeposit ?? 0;
  const vipValidDepositTotal = Number((user as any).vipValidDepositTotal ?? 0);
  const vipLevel = (user as any).vipLevel ?? 0;
  const claimedVipLevels = Array.isArray((user as any).claimedVipLevels) ? ((user as any).claimedVipLevels as number[]) : [];
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    balance,
    role: user.role ?? 'user',
    totalDeposit,
    vipValidDepositTotal,
    vipLevel,
    claimedVipLevels,
    hasBankCard,
    bankName: bankName ?? null,
    bankAccountNumber: bankAccountNumber ?? null,
  };
}
