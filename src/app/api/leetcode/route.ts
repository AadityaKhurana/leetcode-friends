// app/api/leetcode/route.ts
import { LeetCode } from 'leetcode-query';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const lc = new LeetCode();
    const user = await lc.user(username);
    return NextResponse.json(user);
  }
  catch (err: unknown) {
  if (err instanceof Error) return NextResponse.json({ error: 'Failed to fetch profile', details: err.message }, { status: 500 });
  else return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
}
}
