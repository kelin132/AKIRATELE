/**
 * KELIN MD — Active Socket Registry
 * Holds a reference to the currently active bot transport so background jobs
 * (card spawner, tax scheduler, etc.) can use it without importing a specific bot file.
 */

let _activeBot = null;

export function registerActiveBot(bot) {
  _activeBot = bot;
}

export function getActiveBot() {
  return _activeBot;
}
