export class Decimal {
  constructor(v: any);
  toNumber(): number;
  toString(): string;
  valueOf(): number;
}
export const Prisma: {
  Decimal: typeof Decimal;
  InputJsonValue: any;
};
export class PrismaClient {
  user: any;
  wallet: any;
  transaction: any;
  bet: any;
  roundSeed: any;
  depositRequest: any;
  withdrawRequest: any;
  gameConfig: any;
  gamePayoutConfig: any;
  supportTicket: any;
  supportMessage: any;
  siteContent: any;
  userLoginHistory: any;
  adminAuditLog: any;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction(fn: (tx: any) => Promise<any>): Promise<any>;
  $queryRaw(query: any, ...args: any[]): Promise<any[]>;
  $extends(args: any): this;
}
export default PrismaClient;
