import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { webhookCallback } from "https://deno.land/x/grammy@v1.14.1/mod.ts";

import { bot } from "./bot.ts";

const handleUpdate = webhookCallback(bot, "std/http");
const SECRET = Deno.env.get("SECRET");

serve(async (req) => {
	if (req.method === "POST") {
		const url = new URL(req.url);
		if (url.pathname.slice(1) === SECRET) {
			try {
				return await handleUpdate(req);
			} catch (err) {
				console.error(err);
			}
		}
	}
	return new Response("TheWatBot is up and running!");
});
