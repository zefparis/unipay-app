import { NextResponse } from 'next/server';

const COIN_IDS      = ['bitcoin', 'ethereum', 'binancecoin', 'tether'];
const WCGLT_CONTRACT = '0x6b402687B45f98913dF7409660A8f04f81752f8B';

export const revalidate = 60; // Next.js 60 s cache

export async function GET() {
  try {
    const [cgRes, dexRes] = await Promise.allSettled([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
        { next: { revalidate: 60 } },
      ),
      fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${WCGLT_CONTRACT}`,
        { next: { revalidate: 60 } },
      ),
    ]);

    const cgData   = cgRes.status   === 'fulfilled' && cgRes.value.ok   ? await cgRes.value.json()   : null;
    const dexData  = dexRes.status  === 'fulfilled' && dexRes.value.ok  ? await dexRes.value.json()  : null;

    return NextResponse.json(
      { coins: cgData, dex: dexData },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      },
    );
  } catch {
    return NextResponse.json({ coins: null, dex: null }, { status: 200 });
  }
}
