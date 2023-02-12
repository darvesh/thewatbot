import { bot } from "./bot.ts";

bot.start({
	drop_pending_updates: true,
	onStart: () => console.log("Bot started"),
});
