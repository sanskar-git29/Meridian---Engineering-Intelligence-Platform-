 export function parseExpirationToMs(exp: string): number {
  const match = exp.match(/^(\d+)\s*(d|h|m|s)?$/i);

  if (!match) {
    throw new Error(`Invalid expiration: ${exp}`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? "d").toLowerCase();

  switch (unit) {
    case "d":
      return amount * 24 * 60 * 60 * 1000;

    case "h":
      return amount * 60 * 60 * 1000;

    case "m":
      return amount * 60 * 1000;

    case "s":
      return amount * 1000;

    default:
      throw new Error(`Unsupported expiration unit: ${unit}`);
  }
}