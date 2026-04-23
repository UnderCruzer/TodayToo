const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
