const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN!;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export async function fetchSheetRanges(
  ranges: string[]
): Promise<string[][][]> {
  const token = await getAccessToken();
  const rangeParams = ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join("&");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${rangeParams}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sheets API error: ${error}`);
  }

  const data = await response.json();
  return (data.valueRanges || []).map(
    (vr: { values?: string[][] }) => vr.values || []
  );
}

export async function fetchSheet(range: string): Promise<string[][]> {
  const results = await fetchSheetRanges([range]);
  return results[0] || [];
}

export { SPREADSHEET_ID };
