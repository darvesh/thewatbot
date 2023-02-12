import {
	Bot,
	Context,
	NextFunction,
} from "https://deno.land/x/grammy@v1.14.1/mod.ts";
import { pipeline } from "./helper.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

if (!BOT_TOKEN) throw new Error("Bot Token is not set!");

const bot = new Bot(BOT_TOKEN);

async function responseTime(ctx: Context, next: NextFunction): Promise<void> {
	console.count(ctx.inlineQuery?.query);
	const before = Date.now(); // milliseconds
	await next();
	const after = Date.now(); // milliseconds
	console.log(`Response time: ${after - before} ms`);
}

bot.use(responseTime);

bot.inlineQuery(/^[\w\s'-]+$/, async (ctx) => {
	const userQuery = ctx.update.inline_query.query;
	const results = await pipeline(userQuery);
	return ctx.answerInlineQuery(results);
});

bot.catch(console.error);

export { bot };
