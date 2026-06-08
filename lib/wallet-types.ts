export type Currency = 'CDF' | 'USDT' | 'CGLT' | 'USD';

export interface WalletBalance {
  wallet_id:    string;
  balance_cdf:  number;
  cglt_balance: number;
  usdt_balance: number;
  usd_balance:  number;
  currency:     Currency;
  kyc_level:    number;
}
