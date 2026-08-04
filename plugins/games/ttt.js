/**
 * Tic Tac Toe — inline keyboard game against the bot.
 */

const games = new Map(); // chatId → { board, turn, msgId }

function emptyBoard() { return Array(9).fill(null); }

function checkWinner(b) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, c1, d] of lines) {
    if (b[a] && b[a] === b[c1] && b[a] === b[d]) return b[a];
  }
  return b.includes(null) ? null : "draw";
}

function renderBoard(board) {
  const icons = { X: "❌", O: "⭕", null: "⬜" };
  return {
    inline_keyboard: [
      [0,1,2].map(i => ({ text: icons[board[i]], callback_data: `ttt:${i}` })),
      [3,4,5].map(i => ({ text: icons[board[i]], callback_data: `ttt:${i}` })),
      [6,7,8].map(i => ({ text: icons[board[i]], callback_data: `ttt:${i}` })),
    ],
  };
}

function botMove(board) {
  // Simple AI: prefer win, then block, then center, then random
  const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
  for (const move of empty) {
    const b = [...board]; b[move] = "O";
    if (checkWinner(b) === "O") return move;
  }
  for (const move of empty) {
    const b = [...board]; b[move] = "X";
    if (checkWinner(b) === "X") return move;
  }
  if (board[4] === null) return 4;
  return empty[Math.floor(Math.random() * empty.length)];
}

export default {
  name: "ttt",
  aliases: ["tictactoe"],
  description: "Play Tic Tac Toe against the bot",
  category: "games",
  usage: ".ttt",
  cooldown: 3,
  async run({ ctx }) {
    const chatId = ctx.chat.id;
    const board  = emptyBoard();
    const msg    = await ctx.reply(
      "❌ *Tic Tac Toe* — You are ❌\nPick a square:",
      { parse_mode: "Markdown", reply_markup: renderBoard(board) },
    );
    games.set(chatId, { board, msgId: msg.message_id, userId: ctx.from.id });
  },
};

// Register callback query handler on bot object at module load time via a side-effectful approach
// The bot handles this externally via the action middleware registered in telegramBot.mjs
export function handleTttCallback(ctx) {
  const chatId = ctx.chat?.id ?? ctx.callbackQuery?.message?.chat?.id;
  if (!chatId) return ctx.answerCbQuery("Game not found.");

  const game = games.get(chatId);
  if (!game) return ctx.answerCbQuery("No active game. Start one with .ttt");

  if (ctx.from.id !== game.userId) return ctx.answerCbQuery("This isn't your game!");

  const idx = parseInt(ctx.callbackQuery.data.split(":")[1]);
  if (game.board[idx] !== null) return ctx.answerCbQuery("That square is taken!");

  game.board[idx] = "X";
  const win = checkWinner(game.board);

  if (win === "X") {
    games.delete(chatId);
    return ctx.editMessageText("🎉 *You win!* ❌ beats ⭕", {
      parse_mode: "Markdown",
      reply_markup: renderBoard(game.board),
    }).then(() => ctx.answerCbQuery("You win!"));
  }
  if (win === "draw") {
    games.delete(chatId);
    return ctx.editMessageText("🤝 *It's a draw!*", {
      parse_mode: "Markdown",
      reply_markup: renderBoard(game.board),
    }).then(() => ctx.answerCbQuery("Draw!"));
  }

  // Bot turn
  const botIdx = botMove(game.board);
  if (botIdx !== undefined) {
    game.board[botIdx] = "O";
    const win2 = checkWinner(game.board);
    if (win2 === "O") {
      games.delete(chatId);
      return ctx.editMessageText("🤖 *Bot wins!* ⭕ beats ❌", {
        parse_mode: "Markdown",
        reply_markup: renderBoard(game.board),
      }).then(() => ctx.answerCbQuery("Bot wins!"));
    }
    if (win2 === "draw") {
      games.delete(chatId);
      return ctx.editMessageText("🤝 *It's a draw!*", {
        parse_mode: "Markdown",
        reply_markup: renderBoard(game.board),
      }).then(() => ctx.answerCbQuery("Draw!"));
    }
  }

  return ctx.editMessageText(
    "❌ *Tic Tac Toe* — Your turn ❌",
    { parse_mode: "Markdown", reply_markup: renderBoard(game.board) },
  ).then(() => ctx.answerCbQuery(""));
}
