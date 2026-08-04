/**
 * KELIN MD — Auction Manager
 * Holds active auctions in memory. One auction per group at a time.
 */

const auctions = new Map();

export function getAuction(chatId)         { return auctions.get(chatId) ?? null; }
export function hasAuction(chatId)         { return auctions.has(chatId); }
export function setAuction(chatId, auction){ auctions.set(chatId, auction); }

export function deleteAuction(chatId) {
  const a = auctions.get(chatId);
  if (a?.timer) clearTimeout(a.timer);
  auctions.delete(chatId);
}

export function placeBid(chatId, bidderId, amount) {
  const a = auctions.get(chatId);
  if (!a)                   return { ok: false, reason: "no_auction" };
  if (bidderId === a.sellerId) return { ok: false, reason: "own_auction" };
  if (amount <= a.currentBid)  return { ok: false, reason: "too_low",      current: a.currentBid };
  if (amount < a.startBid)     return { ok: false, reason: "below_start",  start:   a.startBid };
  a.currentBid    = amount;
  a.currentBidder = bidderId;
  return { ok: true };
}

export function timeLeft(chatId) {
  const a = auctions.get(chatId);
  if (!a) return 0;
  return Math.max(0, Math.ceil((a.endsAt - Date.now()) / 1000));
}
