import { Bot } from "grammy";
import mongoose from "mongoose";

import {
  transform,
  fetchWords,
  createTemplate,
  createNewRecord,
} from "./util.js";
import { Db } from "./db.js";
import { BOT_TOKEN, MONGO_DB } from "./config.js";

const bot = new Bot(BOT_TOKEN);

const db = new Db(mongoose, MONGO_DB);

bot.command("help", (ctx) =>
  ctx.reply("This is an inline bot. Type @thewatbot word")
);

bot.command("start", (ctx) =>
  ctx.reply("Developer: @solooo7. https://buymeacoffee.com/darvesh")
);

bot.inlineQuery(/^[\w\s]+$/, async (ctx) => {
  const userQuery = ctx.update.inline_query.query;
  if (!userQuery) return;
  const words =
    (await db.findWords(userQuery)) ??
    (await createNewRecord(db, fetchWords, transform, userQuery));
  if (words?.length) return ctx.answerInlineQuery(createTemplate(words));
});

bot.catch(console.error);

bot.start({
  drop_pending_updates: true,
  onStart: () => console.log("Bot started"),
});
