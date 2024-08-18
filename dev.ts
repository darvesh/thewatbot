import { bot } from "./bot.ts";

bot.catch(console.error);

bot.start({
  drop_pending_updates: true,
  onStart: () => console.log("Bot started"),
});
