import { InlineKeyboard } from "https://deno.land/x/grammy@v1.14.1/mod.ts";
import { InlineQueryResult } from "https://deno.land/x/grammy@v1.14.1/types.ts";

interface Dictionary {
	partOfSpeech: string;
	language: string;
	definitions: Definition[];
}

interface Definition {
	definition: string;
	examples?: string[];
}

export const API_URL = "https://en.wiktionary.org/api/rest_v1/page/definition";

function escape(text: string) {
	return text.replace(/<[^>]*>/g, "").trim();
}

async function api(word: string, language: "en" = "en") {
	const dictionary = await fetch(`${API_URL}/${word}`)
		.then((res) => res.json())
		.then((res) => res?.[language]);
	if (!dictionary?.length) return [];
	return dictionary as Dictionary[];
}

function format({
	word,
	partOfSpeech,
	definition,
	examples,
}: {
	word: string;
	partOfSpeech: string;
	definition: string;
	examples: string[];
}) {
	return (
		`<b>${escape(word)}</b> (${escape(partOfSpeech.toLowerCase())})` +
		"\n\n" +
		`${escape(definition)}` +
		"\n\n" +
		`${
			examples.length
				? `Examples: \n${examples
						.slice(0, 10)
						.map((eg) => `- <i>${escape(eg.trim())}</i>`)
						.join("\n")}`
				: ""
		}`
	);
}

export function createResults(
	word: string,
	dictionaries: Dictionary[]
): InlineQueryResult[] {
	return dictionaries.flatMap((dictionary, didx) => {
		return dictionary.definitions
			.filter((def) => Boolean(escape(def.definition).trim()))
			.map((def, widx) => {
				return {
					type: "article",
					id: `${word}${didx}${widx}`,
					title: `${word} (${dictionary.partOfSpeech.toLowerCase()})`,
					description: escape(def.definition),
					cache_time: 2592000, //30_DAYS
					input_message_content: {
						message_text: format({
							word,
							definition: def.definition,
							examples: def.examples?.length ? def.examples : [],
							partOfSpeech: dictionary.partOfSpeech,
						}),
						parse_mode: "HTML",
					},
					reply_markup: new InlineKeyboard()
						.row()
						.switchInlineCurrent("Other definitions", word),
				};
			});
	});
}

function emptyResult(word = ""): InlineQueryResult[] {
	return [
		{
			type: "article",
			id: "thewatbotnotfoundtheword",
			title: `No result found`,
			input_message_content: {
				message_text: `No definitions found for ${word.toLowerCase()}`,
				parse_mode: "HTML",
			},
			reply_markup: new InlineKeyboard()
				.row()
				.switchInlineCurrent("Try another word", word),
		},
	];
}

export async function pipeline(word: string) {
	if (word == "") return emptyResult();
	const dictionaries = await api(word);
	if (!dictionaries.length) return emptyResult(word);
	return createResults(word, dictionaries.slice(0, 50));
}
