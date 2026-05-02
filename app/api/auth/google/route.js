import { NextResponse } from 'next/server'

export async function POST(req) {
  const { credential } = await req.json()
  const res = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential)
  const data = await res.json()
  if (data.aud !== process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  return NextResponse.json({ email: data.email, name: data.name, picture: data.picture })
}