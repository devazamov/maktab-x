import crypto from "crypto";

/**
 * Validates Telegram WebApp `initData` per the official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * secret_key = HMAC_SHA256("WebAppData", bot_token)
 * expected   = HMAC_SHA256(secret_key, data_check_string)
 *
 * This MUST run on the server. Never trust initData that hasn't been
 * verified against the bot token.
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
  raw: URLSearchParams;
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // reject stale sessions after 24h

export function validateTelegramInitData(
  initData: string,
  botToken: string
): ValidatedInitData | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const valid =
    computedHash.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));

  if (!valid) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    return null; // expired
  }

  const userRaw = params.get("user");
  if (!userRaw) return null;

  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return null;
  }

  return { user, authDate, raw: params };
}
