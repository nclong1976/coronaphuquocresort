import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGameBalance } from '../hooks/useGameBalance';

export function ThreeCardPoker({ onBack }: { onBack: () => void }) {
  const balance = useGameBalance();
  return (
    <div className="relative flex flex-col h-screen w-full max-w-md mx-auto overflow-hidden bg-slate-950 shadow-2xl border-x border-primary/30">
      <style>{`
        .glass-panel {
            background: rgba(212, 175, 55, 0.1);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(212, 175, 55, 0.3);
        }
        .gold-gradient {
            background: linear-gradient(135deg, #fef08a 0%, #d4af37 50%, #854d0e 100%);
        }
        .metallic-button {
            background: linear-gradient(180deg, #fef08a 0%, #d4af37 100%);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.5);
        }
        .card-slot {
            background: rgba(0,0,0,0.5);
            border: 2px dashed rgba(212, 175, 55, 0.3);
        }
      `}</style>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-black"></div>
      <div className="relative z-10 flex items-center justify-between p-4 bg-black/60 backdrop-blur-md border-b border-primary/40 shadow-[0_4px_15px_rgba(212,175,55,0.15)]">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-primary hover:bg-primary/20 p-2 rounded-full transition-colors">
            <ArrowLeft className="drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-primary/80 font-bold drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">Table #042</span>
          <h2 className="text-[#fef08a] text-sm font-black tracking-tight drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">BÀI CÀO GOLD LUXURY</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-primary/80 font-medium drop-shadow-[0_0_3px_rgba(212,175,55,0.3)]">BALANCE</p>
            <p className="text-[#fef08a] text-sm font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>
      <div className="relative z-10 h-1/3 w-full overflow-hidden border-b border-primary/40 shadow-[0_4px_20px_rgba(212,175,55,0.1)]">
        <img alt="Professional female casino dealer" className="w-full h-full object-cover object-top opacity-85" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_1fqm71Ru_SHP6bffEC0fvEX0b_QCKC0--as5yPoIviO7WMfU8B0M_EL7wD4FtUIl-YMosKrSbHgz44j8e6rt3j3Bi8qKSCGLhSwAAUjZX7C1Q16J0pghVvm6_LjbA_QjooicbFjkgTGUiUsXjAL6aMiova2xtPH1J6VYgzQpymVegGZBLR944ImStJtKYENjCWVNz_DLFsU_PhKpvq2zj7q9CrGbHDsRA2S4fZxTx0FfiTAJCZ0u_tMLs1-KbR7stx1PIsrsIWr9" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        <div className="absolute bottom-4 left-4 w-48 glass-panel border border-primary/50 bg-black/40 p-2 rounded-xl text-[11px] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fef08a] shadow-[0_0_8px_#fef08a]"></div>
            <span className="text-[#fef08a] font-bold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">System</span>
          </div>
          <p className="text-white/95 font-medium">Welcome to the VIP Table. Good luck!</p>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex flex-col p-4 gap-6 bg-gradient-to-b from-slate-950 to-[#0a0804]">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-[#fef08a] tracking-widest font-bold uppercase drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">Dealer Hand</p>
          <div className="flex gap-2">
            <div className="w-16 h-24 rounded-lg border border-primary/60 bg-slate-900 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.15)] relative">
              <img alt="Casino logo back" className="w-full h-full object-cover opacity-90 mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDliBxvlRZDzz-2t8VU5cQECX5EyNtFDf4fbrGCF5_TjJD-3mtz4NvDxQfZZtTkVg8UAeMgvvJIquT81BFFL8sptbeCBZR1hN_7PVNcij6HNZmQcB_hh1GgxBtFy2eyVBBkTJpEwo8AiEvId_zenejt0ldtvlD383ZCDgN3yQbdlxoAigNFgYw8jjqjQKLFxUCPw3_cZQ92lHF3Q3ojg-aPMzQFAp-JXq255COopjULJx2vcFPYW7yD0HLjWQpD9JqTO998-pzaeQri" />
              <div className="absolute inset-0 bg-primary/20 mix-blend-color"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
            </div>
            <div className="w-16 h-24 rounded-lg border border-primary/60 bg-slate-900 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.15)] relative">
              <img alt="Casino logo back" className="w-full h-full object-cover opacity-90 mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgJ8QaCDb6md-ul-wtHim47Ia6N4AXovNA6pPqPCRX3FMasYVX_4TCUERzbq8Gzw63T00I-QdX_C_hUyVraOz_B0tNFaU-K1vl-JlzQ3OWqdpFuZ5y1Fd7vh_0HN0L_yF5H_syUBeyLHD0pdwiYx6YxQaA3xvfPOyV246nTOzd8vizA18AvWYe_Nww2ms6oagjlPPhqpHcs1fuM7B_YiSZUlAlv4MiL7x_6bCMUJSe4fErQLOpWeVuwyW3O2a81vgN81e_FOlIKriS" />
              <div className="absolute inset-0 bg-primary/20 mix-blend-color"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
            </div>
            <div className="w-16 h-24 rounded-lg border border-primary/60 bg-slate-900 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.15)] relative">
              <img alt="Casino logo back" className="w-full h-full object-cover opacity-90 mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-b68y5xutbRwDLt7iNHfwYoKjLu4P-I9fkdUWD5qgFVtcElroxGjTpa9p3F_V_PeUAumm4H8_HkikRqBGRhvLRmVGK-thCCZPNhM0YYmvh-b663YmBICUtk6-0CFmdCeGJnf7E9Z0LQBKburMitDfMbgFF5RUgcsDNhVAeibWwgE_Xg2vggKHDzgpQ3217RxAwz8C0Izh8cu3SUxcfhYk8cx6xB539poWXLBBIMO6C_12vkg_Y4lZY-wYiTO9kA3JEw2myDc0KbaD" />
              <div className="absolute inset-0 bg-primary/20 mix-blend-color"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <div className="w-20 h-28 rounded-xl border border-primary bg-slate-900 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] overflow-hidden relative">
              <img alt="Casino logo back" className="w-full h-full object-cover mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSpg5TwEojI83tH9dokyd05kStxu-zXmqSQ9XsdS_xUiW8jkAYsa5FhFIN8N7o42ckQM6El7FzDLu-z7BrMIpUruBrKFXuEtYosW-wTv5FqjhNPhLy2og5fV4wWFVzp4XgbSfOfcSSBItZnbVCLlW1xcLRkwu9YZvfSXKGT5lbr05BxCuSpbM7ekeSWbyQGnq_hw943tstrdDIfkJJdG2QDB41AQvcg5xv1IfB-n2-w2SOxYXpuWj9XdKUth9JHLByEizyV8Av98AC" />
              <div className="absolute inset-0 bg-primary/30 mix-blend-color"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#fef08a]/20 to-transparent"></div>
            </div>
            <div className="w-20 h-28 rounded-xl border border-primary bg-slate-900 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] overflow-hidden relative">
              <img alt="Casino logo back" className="w-full h-full object-cover mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9B0cUqzGD2xq8FWAMTWF0_SluYyHUHnnQP7y8TbFOLAQhWcaRH8DUBxM9s9iSIKNCqBpV59TJpPgaKWlhBSP6zXIfhmvcmRTyjrKOKt0k2oX22RbzvXFBrOHr_aM8xDxjXqBFOQRkuIXDKS4esqfcKiIFfhaPdh8Oe1qTxMSEB-kvAaXvAjtq3AGsd_yIBEr9FxZqQRuzUPMwnz4uLVtK7UZ6Xo3YOMNkGesB6Q8wS5IRgs4Tq5LMdaickj8ewfuEkTvYbXp6Y_x8" />
              <div className="absolute inset-0 bg-primary/30 mix-blend-color"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#fef08a]/20 to-transparent"></div>
            </div>
            <div className="w-20 h-28 rounded-xl border border-primary bg-slate-900 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] overflow-hidden relative">
              <img alt="Casino logo back" className="w-full h-full object-cover mix-blend-luminosity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAX9ftOMIcGZSK-Wv9w1aNtguxLAh63YAMI2XITgS3B6LlOyb8Rbn0CwqYtv3WmL2A6RqmEMN_UQrhBXtbR59kDTkw_oergwF4wmKmWtb-Z7y859K3g6wgFFxzqKWpyAsF2S7HK-FbIG19TOzEpLz_3L7551mh8YTkR5s-Y3DPo_mvqyPvWu2uS2ZMRmVO3yNqMo2LfCZcrYuzVojKyzZ1XBtgGX-JKbqoLGMu6zYjwCcPyIFXsfJ-QLXuH6B1MC2s_8O5opLa5g1b5" />
              <div className="absolute inset-0 bg-primary/30 mix-blend-color"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#fef08a]/20 to-transparent"></div>
            </div>
          </div>
          <p className="text-[10px] text-[#fef08a] tracking-widest font-bold uppercase mt-1 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">Player Hand</p>
        </div>
        <div className="mt-auto flex justify-between items-center px-2 pb-2">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center border-4 border-[#fffbeb] shadow-[0_0_15px_rgba(212,175,55,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-pointer">
              <span className="text-[#422006] font-black text-xs drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">$50</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center border-4 border-[#fffbeb] shadow-[0_0_15px_rgba(212,175,55,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-pointer">
              <span className="text-[#422006] font-black text-xs drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">$100</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center border-4 border-[#fffbeb] shadow-[0_0_15px_rgba(212,175,55,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-pointer">
              <span className="text-[#422006] font-black text-xs drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">$500</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center border-4 border-[#fffbeb] shadow-[0_0_15px_rgba(212,175,55,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-pointer">
              <span className="text-[#422006] font-black text-xs drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">$1k</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-slate-900 flex flex-col items-center justify-center border-4 border-primary shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer group">
              <span className="text-[8px] text-[#fef08a] font-bold">MAX</span>
              <span className="text-primary font-black text-[10px] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">ALL IN</span>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 bg-[#050402]/90 backdrop-blur-xl border-t border-primary/40 shadow-[0_-4px_20px_rgba(212,175,55,0.1)] p-4">
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center text-[10px] font-bold text-[#fef08a] shadow-[0_0_8px_rgba(212,175,55,0.2)]">P</div>
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">D</div>
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center text-[10px] font-bold text-[#fef08a] shadow-[0_0_8px_rgba(212,175,55,0.2)]">P</div>
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center text-[10px] font-bold text-[#fef08a] shadow-[0_0_8px_rgba(212,175,55,0.2)]">P</div>
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">D</div>
            <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center text-[10px] font-bold text-[#fef08a] shadow-[0_0_8px_rgba(212,175,55,0.2)]">P</div>
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">D</div>
          </div>
          <div className="h-5 w-px bg-primary/40 mx-1"></div>
          <div className="flex gap-1">
            <div className="w-5 h-5 rounded-sm bg-[#0a0804] border border-primary/40 flex items-center justify-center text-[9px] text-primary/90 font-medium">92%</div>
            <div className="w-5 h-5 rounded-sm bg-[#0a0804] border border-primary/40 flex items-center justify-center text-[9px] text-primary/90 font-medium">88%</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex items-center justify-center py-3 px-4 rounded-xl border border-primary/40 bg-[#0a0804] text-primary/90 font-bold text-xs uppercase tracking-wider hover:bg-[#1a150a] transition-colors shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]">
            CLEAR
          </button>
          <div className="flex flex-col items-center justify-center py-2 px-2 rounded-xl border border-primary/50 bg-[#050402] shadow-[inset_0_0_15px_rgba(212,175,55,0.15)]">
            <span className="text-[9px] text-primary/80 font-bold uppercase drop-shadow-[0_0_3px_rgba(212,175,55,0.3)]">BET AMOUNT</span>
            <span className="text-[#fef08a] font-black text-sm drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">$0.00</span>
          </div>
          <button className="flex items-center justify-center py-3 px-4 rounded-xl metallic-button text-[#422006] font-black text-xs uppercase tracking-widest border border-[#fffbeb] active:translate-y-0.5 transition-all shadow-[0_0_20px_rgba(212,175,55,0.6),inset_0_2px_5px_rgba(255,255,255,0.5)] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
            CONFIRM
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#854d0e] via-[#fef08a] to-[#854d0e] shadow-[0_-2px_10px_rgba(212,175,55,0.5)]"></div>
    </div>
  );
}
