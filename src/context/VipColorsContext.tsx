import React, { createContext, useContext } from 'react';
import { useVipColors, VipColorSet } from '../hooks/useVipColors';

const VipColorsContext = createContext<Record<number, VipColorSet>>({});

export function VipColorsProvider({ children }: { children: React.ReactNode }) {
  const colors = useVipColors();
  return <VipColorsContext.Provider value={colors}>{children}</VipColorsContext.Provider>;
}

export function useVipColorsContext() {
  return useContext(VipColorsContext);
}
