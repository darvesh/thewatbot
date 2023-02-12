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
	console.log(ctx.inlineQuery?.query);
	const before = Date.now(); // milliseconds
	await next();
	const after = Date.now(); // milliseconds
	console.log(`Response time: ${after - before} ms`);
}

bot.use(responseTime);

bot.inlineQuery(/^[\w\s'-]+$/, async (ctx) => {
	const userQuery = ctx.update.inline_query.query;
	const offsetLimit = 50;
	const offset = ctx.update.inline_query.offset.trim()
		? ctx.update.inline_query.offset.split(",")
		: [];
	const [start, end] = offset.length
		? [Number(offset[0]), Number(offset[1])]
		: [0, offsetLimit];
	const results = await pipeline(userQuery);
	return ctx.answerInlineQuery(results.slice(start, end), {
		cache_time: 2592000 /*30_DAYS*/,
		next_offset: `${end},${end + offsetLimit}`,
	});
});

export { bot };
