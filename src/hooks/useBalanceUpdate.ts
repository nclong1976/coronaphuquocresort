import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useStore } from '../store/useStore';

/**
 * Trả về hàm updateBalance: khi đã đăng nhập thì cập nhật cả WalletContext (hiển thị)
 * và useStore (offline fallback). Đảm bảo số dư trong game thay đổi ngay khi thắng/thua.
 */
export function useBalanceUpdate() {
  const { token } = useAuth();
  const { setBalanceFromGame } = useWallet();
  const updateStoreBalance = useStore((s) => s.updateBalance);

  return (delta: number) => {
    updateStoreBalance(delta);
    if (token) {
      setBalanceFromGame((prev) => prev + delta);
    }
  };
}
