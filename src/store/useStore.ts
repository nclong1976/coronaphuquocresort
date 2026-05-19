import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  uid?: string;
  username: string;
  fullName: string;
  balance: number;
  totalDeposit: number;
  vipLevel: number;
  claimedVipLevels: number[];
  hasBankCard: boolean;
}

interface AppState {
  currentScreen: string;
  isSidebarOpen: boolean;
  user: User;
  setCurrentScreen: (screen: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setUser: (user: User | ((prev: User) => User)) => void;
  updateBalance: (amount: number) => void;
  deposit: (amount: number) => void;
}

export const VIP_LEVELS = [
  { level: 0, threshold: 0, bonus: 0, color: 'Xám bạc' },
  { level: 1, threshold: 5000, bonus: 388, color: 'Xanh bạc' },
  { level: 2, threshold: 10000, bonus: 1000, color: 'Đồng' },
  { level: 3, threshold: 20000, bonus: 2000, color: 'Xanh lá' },
  { level: 4, threshold: 40000, bonus: 4000, color: 'Tím' },
  { level: 5, threshold: 60000, bonus: 7000, color: 'Đồng vàng' },
  { level: 6, threshold: 100000, bonus: 14000, color: 'Tím đậm' },
  { level: 7, threshold: 150000, bonus: 30000, color: 'Xanh lá đậm' },
  { level: 8, threshold: 200000, bonus: 45000, color: 'Đỏ' },
  { level: 9, threshold: 400000, bonus: 90000, color: 'Xanh ngọc' },
  { level: 10, threshold: 600000, bonus: 140000, color: 'Vàng' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentScreen: 'home',
      isSidebarOpen: false,
      user: {
        username: 'nguyenvana123',
        fullName: 'NGUYỄN VĂN A',
        balance: 0,
        totalDeposit: 0,
        vipLevel: 0,
        claimedVipLevels: [],
        hasBankCard: false,
      },
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setUser: (userOrUpdater) => set((state) => ({
        user: typeof userOrUpdater === 'function' ? userOrUpdater(state.user) : userOrUpdater
      })),
      updateBalance: (amount) => set((state) => ({ 
        user: { ...state.user, balance: state.user.balance + amount } 
      })),
      deposit: (amount) => {
        const { user } = get();
        const newTotalDeposit = user.totalDeposit + amount;
        
        // Find new VIP level
        let newVipLevel = 0;
        for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
          if (newTotalDeposit >= VIP_LEVELS[i].threshold) {
            newVipLevel = VIP_LEVELS[i].level;
            break;
          }
        }

        // Calculate bonuses for newly reached levels
        let bonusAmount = 0;
        const newClaimedVipLevels = [...user.claimedVipLevels];
        for (let l = 1; l <= newVipLevel; l++) {
          if (!newClaimedVipLevels.includes(l)) {
            bonusAmount += VIP_LEVELS.find(v => v.level === l)?.bonus || 0;
            newClaimedVipLevels.push(l);
          }
        }

        set((state) => ({
          user: {
            ...state.user,
            totalDeposit: newTotalDeposit,
            vipLevel: newVipLevel,
            balance: state.user.balance + amount + bonusAmount,
            claimedVipLevels: newClaimedVipLevels,
          }
        }));

        if (newVipLevel > user.vipLevel) {
          const newVip = VIP_LEVELS.find(v => v.level === newVipLevel);
          setTimeout(() => {
            alert(`🎉 CHÚC MỪNG!\n\nBạn đã đạt VIP ${newVipLevel}!\nThẻ của bạn đã được nâng cấp lên màu ${newVip?.color}.\nBạn nhận được tổng cộng ${bonusAmount.toLocaleString()} USD tiền thưởng VIP!`);
          }, 100);
        } else {
          setTimeout(() => {
            alert(`✅ Nạp tiền thành công!\n\nSố tiền: ${amount.toLocaleString()} USD`);
          }, 100);
        }
      }
    }),
    {
      name: 'casino_user_state',
      partialize: (state) => ({ user: state.user }), // Only persist user state
    }
  )
);
