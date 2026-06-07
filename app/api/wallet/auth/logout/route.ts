import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies();
  const response = NextResponse.json({ success: true });
  response.cookies.set('wallet_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
