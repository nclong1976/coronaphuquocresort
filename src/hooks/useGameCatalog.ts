import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { gameApi, type GameCatalogPayload } from '../api/client';

/** id ô game trên màn Casino → gameId trong DB / validateGameBet */
export const CASINO_SCREEN_TO_GAME_ID: Record<string, string> = {
  xucxac: 'sicbo',
  slots: 'slot',
  texas: 'texasholdem',
  russian: 'russianpoker',
  xidach: 'blackjack',
  baicao: 'baicao',
  tigerbaccarat: 'tigerbaccarat',
  /** API Long Hổ dùng dragontiger cho giới hạn / bật tắt thực tế */
  baccaratlongho: 'dragontiger',
  threecard: 'threecard',
  caribbean: 'caribbean',
  niuniu: 'niuniu',
  roulette: 'roulette',
};

export function useGameCatalog(socket: Socket | null, token: string | null) {
  const [catalog, setCatalog] = useState<GameCatalogPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setCatalog(null);
      return;
    }
    setLoading(true);
    try {
      const data = await gameApi.gameCatalog();
      setCatalog(data);
    } catch {
      setCatalog(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload: GameCatalogPayload) => {
      if (payload?.games && Array.isArray(payload.games)) setCatalog(payload);
    };
    const onReconnect = () => {
      void refresh();
    };
    socket.on('game_config_updated', onUpdate);
    socket.on('connect', onReconnect);
    return () => {
      socket.off('game_config_updated', onUpdate);
      socket.off('connect', onReconnect);
    };
  }, [socket, refresh]);

  const byGameId = useMemo(() => {
    const m = new Map<string, GameCatalogPayload['games'][0]>();
    catalog?.games.forEach((g) => m.set(g.gameId, g));
    return m;
  }, [catalog]);

  const rowForCasinoScreen = useCallback(
    (screenId: string) => {
      const gid = CASINO_SCREEN_TO_GAME_ID[screenId] ?? screenId;
      return byGameId.get(gid) ?? null;
    },
    [byGameId]
  );

  const isCasinoScreenEnabled = useCallback(
    (screenId: string) => {
      const row = rowForCasinoScreen(screenId);
      if (!row) return true;
      return row.enabled;
    },
    [rowForCasinoScreen]
  );

  return { catalog, loading, refresh, rowForCasinoScreen, isCasinoScreenEnabled, byGameId };
}
