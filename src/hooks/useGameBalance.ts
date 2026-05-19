import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useStore } from '../store/useStore';

/**
 * Trả về số dư đồng bộ: useWallet khi đã đăng nhập, useStore khi chơi offline.
 * Đảm bảo số dư trong game luôn khớp với trang cá nhân.
 */
export function useGameBalance() {
  const { token } = useAuth();
  const { balance: walletBalance } = useWallet();
  const storeUser = useStore((s) => s.user);

  return token ? walletBalance : storeUser.balance;
}
