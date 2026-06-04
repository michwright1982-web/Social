import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Mock validation: In a real SaaS, this would check against a database (e.g. Supabase, Postgres)
    if (password.length < 6) {
      return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
    }

    // Create a mock session token
    const token = Buffer.from(JSON.stringify({ email, timestamp: Date.now() })).toString('base64');

    const response = NextResponse.json({ success: true, message: 'Logged in successfully' });

    // Set HTTP-only secure cookie
    response.cookies.set('ai_marketing_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
