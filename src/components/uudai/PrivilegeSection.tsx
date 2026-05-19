import React from 'react';
import { ArrowUp } from 'lucide-react';

export function PrivilegeSection({ totalDeposit, vipReward }: { totalDeposit: number; vipReward: number }) {
  const fmt = (n: number) => n.toLocaleString('en-US');
  return (
    <section>
      <div className="bg-[#fff9e6] border-y border-[#f0e68c] py-2 text-center">
        <span className="font-bold text-gray-900">Đặc quyền riêng tư</span>
      </div>
      <div className="flex justify-center gap-6 p-6">
        <div className="w-32 flex flex-col items-center bg-[#fffdf0] border border-[#f5eeb3] rounded-xl p-3 shadow-sm">
          <div className="bg-white rounded-full p-2 mb-2 shadow-inner border border-yellow-100">
            <ArrowUp className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-[10px] font-bold text-gray-900 text-center uppercase leading-tight">TỔNG NẠP</p>
          <p className="text-red-700 font-bold text-lg">{fmt(totalDeposit)}</p>
        </div>
        <div className="w-32 flex flex-col items-center bg-[#fffdf0] border border-[#f5eeb3] rounded-xl p-3 shadow-sm">
          <div className="bg-white rounded-full p-2 mb-2 shadow-inner border border-yellow-100">
            <span className="text-2xl">🎂</span>
          </div>
          <p className="text-[10px] font-bold text-gray-900 text-center uppercase leading-tight">THƯỞNG VIP</p>
          <p className="text-red-700 font-bold text-lg">{fmt(vipReward)}</p>
        </div>
      </div>
    </section>
  );
}
