const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function registerElder(name: string, language: 'ja' | 'ko'): Promise<{ elderId: string; name: string }> {
  const res = await fetch(`${BASE_URL}/api/elder/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, language }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  return res.json() as Promise<{ elderId: string; name: string }>;
}

export async function getTodayMessage(elderId: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/api/elder/${elderId}/today`);
  if (!res.ok) return null;
  const data = await res.json() as { message: string | null };
  return data.message;
}

export async function sendReply(
  elderId: string,
  message: string,
  imageUrl?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/elder/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elderId, message, imageUrl }),
  });
  if (!res.ok) throw new Error(`Reply failed: ${res.status}`);
}

export async function getConversations(elderId: string) {
  const res = await fetch(`${BASE_URL}/api/elder/${elderId}/conversations`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function getMemoirs(elderId: string) {
  const res = await fetch(`${BASE_URL}/api/elder/${elderId}/memoirs`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function registerPushToken(
  elderId: string,
  pushToken: string
): Promise<void> {
  await fetch(`${BASE_URL}/api/elder/push-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elderId, pushToken }),
  });
}
