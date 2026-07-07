export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    console.error(`API error ${res.status} from ${url}:`, body);
    throw new Error(`API error ${res.status} from ${url}`);
  }
  return res.json();
}
