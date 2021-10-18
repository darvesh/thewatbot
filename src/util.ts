import fetch from "node-fetch";

import { Db } from "./db.js";
import { API_URL } from "./config.js";
import { APIResponse, Word } from "./type.js";
import { InlineQueryResult } from "@grammyjs/types";

export const fetchWords = (word: string) =>
  fetch(`${API_URL}/${word}`).then(
    (res) => res.json() as Promise<APIResponse[]>
  );

export const transform = (dictionary: APIResponse[]): Omit<Word, "_id">[] =>
  dictionary.flatMap((page) =>
    page.meanings.flatMap((definition) =>
      definition.definitions.map((meaning) => ({
        ...meaning,
        example: meaning?.example || "",
        word: page.word,
        phonetic: page.phonetic,
        origin: page.origin,
        partOfSpeech: definition.partOfSpeech,
        synonyms: meaning?.synonyms.join(", "),
        antonyms: meaning?.antonyms.join(", "),
      }))
    )
  );

type fetchWords = typeof fetchWords;
type transform = typeof transform;

export const createNewRecord = async (
  db: Db,
  fetchWords: fetchWords,
  transform: transform,
  userQuery: string
) => {
  console.count(userQuery);
  const result = await fetchWords(userQuery);
  if (!Array.isArray(result)) return null;
  const wordList = transform(result);
  const words = await db.insertWords(wordList);
  //don't have to wait for inserting
  db.insertQuery(
    userQuery,
    words.map((word) => word._id)
  ).catch(console.error);
  return words;
};

const capFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const createMessage = (word: Word) => {
  return `<b>${word.word}</b>  ${
    word.phonetic ? `(<i>${word.phonetic})</i>` : ""
  } (${word.partOfSpeech})\n\n${capFirst(word.definition)} ${
    word.synonyms ? `\n\n<b>Synonyms:</b> <i>${word.synonyms}</i>` : ""
  }${word.antonyms ? `\n\n<b>Antonyms:</b> <i>${word.antonyms}</i>` : ""}${
    word.example ? `\n\n<b>Example:</b> <i>${capFirst(word.example)}</i>` : ""
  }${word.origin ? `\n\n<b>Origin:</b> <i>${word.origin}</i>` : ""}`;
};

export const createTemplate = (words: Word[]): InlineQueryResult[] =>
  words.map((word) => ({
    type: "article",
    id: word._id,
    title: word.word,
    description: word.definition,
    input_message_content: {
      message_text: createMessage(word),
      parse_mode: "HTML",
    },
  }));
