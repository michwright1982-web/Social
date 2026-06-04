import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the session cookie
  response.cookies.delete('ai_marketing_session');
  
  return response;
}
