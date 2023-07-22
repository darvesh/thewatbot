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

interface List {
	word: string;
	partOfSpeech: string;
	definition: string;
	examples?: string[];
}

export const API_URL = "https://en.wiktionary.org/api/rest_v1/page/definition";

function escape(text: string) {
	return text
		.replace(/<[^>]*>/g, "")
		.replaceAll("&nbsp;", "")
		.split(".\n ")
		.map((str) => str.trim())
		.join(".\n")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("&", "&amp;");
}

const outliers = [
	"Alternative letter-case form of ",
	"Misspelling of ",
	"Alternative form of ",
	"Alternative spelling of ",
	"plural of ",
	"Obsolete form of ",
	"present participle of ",
	"simple past tense and past participle of ",
	"simple past tense of ",
	"past participle of ",
] as const;

async function api(word: string, language: "en" = "en"): Promise<List[]> {
	const dictionary = await fetch(`${API_URL}/${word}`)
		.then((res) => res.json())
		.then((res) => res?.[language]);
	if (!dictionary?.length) return [];
	const words = (dictionary as Dictionary[]).flatMap((dict) =>
		dict.definitions.map((def) => ({
			word: escape(word),
			partOfSpeech: escape(dict.partOfSpeech),
			definition: escape(def.definition),
			examples: def?.examples?.map((example) => escape(example)),
		}))
	);
	return words;
}

async function recursiveFetch(list: List[]) {
	const words = await Promise.all(
		list.map(async (ele) => {
			if (outliers.some((outlier) => ele.definition.startsWith(outlier))) {
				const word = ele.definition
					.split(" ")
					.at(-1)
					?.match(/[\s_\-'"\w]+/)
					?.toString();
				if (!word || typeof word !== "string") return [];
				const relatedWords = await api(word);
				return [ele, ...relatedWords];
			}
			return ele;
		})
	);
	return words.flat();
}

function filter(list: List[]) {
	const unique = new Set<string>();
	return list.filter((word) => {
		const def = word.definition.trim();
		if (!def.trim()) return false;
		if (unique.has(word.definition.toLowerCase())) return false;
		if ([outliers[0], outliers[1]].some((outlier) => def.startsWith(outlier)))
			return false;
		unique.add(def);
		return true;
	});
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
		`<b>${word}</b> (${partOfSpeech.toLowerCase()})` +
		"\n\n" +
		`${definition}` +
		"\n\n" +
		`${
			examples.length
				? `Examples: \n${examples
						.slice(0, 10)
						.map((eg) => `- <i>${eg.trim()}</i>`)
						.join("\n")}`
				: ""
		}`
	);
}

export function createResults(
	word: string,
	dictionaries: List[]
): InlineQueryResult[] {
	return dictionaries.map((def, widx) => {
		return {
			type: "article",
			id: `${def.word}${widx}`,
			title: `${def.word} (${def.partOfSpeech.toLowerCase()})`,
			description: def.definition,
			input_message_content: {
				message_text: format({
					word,
					definition: def.definition,
					examples: def.examples?.length ? def.examples.slice(0, 10) : [],
					partOfSpeech: def.partOfSpeech,
				}).slice(0, 4096),
				parse_mode: "HTML",
			},
			reply_markup: new InlineKeyboard()
				.row()
				.switchInlineCurrent("Other definitions", word),
		};
	});
}

function emptyResult(word): InlineQueryResult[] {
	return [
		{
			type: "article",
			id: "thewatbotnotfoundtheword",
			title: `No result found`,
			input_message_content: {
				message_text: `No definitions found for "<i>${word.toLowerCase()}</i>”`,
				parse_mode: "HTML",
			},
			reply_markup: new InlineKeyboard()
				.row()
				.switchInlineCurrent("Try another word", word.slice(0, -1)),
		},
	];
}

export async function pipeline(word: string) {
	if (typeof word !== "string" || word.trim() == "") return emptyResult();
	const dictionaries = await api(word);
	if (!dictionaries.length) return emptyResult(word);
	const words = await recursiveFetch(dictionaries);
	if (!words.length) return emptyResult(word);
	const filtered = filter(words);
	if (!filtered.length) return emptyResult(word);
	return createResults(word, filtered);
}
