/**
 * Mobile money fee rate — fallback only, until the authoritative
 * value arrives from GET /v1/wallet/balance (`fee_rate`), which is
 * driven by WALLET_FEE_RATE on unipay-api (default 0.05 = 5%).
 */
export const FEE_RATE = 0.05;
