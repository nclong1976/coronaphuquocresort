import { getIsoWeekdayMon1Sun7, timeHHMM } from './payoutWeekday.js';
import { getSicBoPayoutSnapshot, getTimedPayoutRatio } from './payoutConfigService.js';

export async function buildAdminPayoutLivePayload() {
  const at = new Date();
  const [
    sic,
    tP,
    tB,
    tT,
    dD,
    dT,
    dTi,
    bP,
    bB,
    bTi,
  ] = await Promise.all([
    getSicBoPayoutSnapshot(at),
    getTimedPayoutRatio('tigerbaccarat', 'PLAYER', 2, at),
    getTimedPayoutRatio('tigerbaccarat', 'BANKER', 1.95, at),
    getTimedPayoutRatio('tigerbaccarat', 'TIE', 9, at),
    getTimedPayoutRatio('dragontiger', 'DRAGON', 2, at),
    getTimedPayoutRatio('dragontiger', 'TIGER', 2, at),
    getTimedPayoutRatio('dragontiger', 'TIE', 9, at),
    getTimedPayoutRatio('baicao', 'PLAYER', 2, at),
    getTimedPayoutRatio('baicao', 'BANKER', 1.95, at),
    getTimedPayoutRatio('baicao', 'TIE', 9, at),
  ]);

  return {
    serverTime: timeHHMM(at),
    isoWeekday: getIsoWeekdayMon1Sun7(at),
    sicbo: sic,
    tigerbaccarat: { PLAYER: tP, BANKER: tB, TIE: tT },
    dragontiger: { DRAGON: dD, TIGER: dT, TIE: dTi },
    baicao: { PLAYER: bP, BANKER: bB, TIE: bTi },
  };
}
