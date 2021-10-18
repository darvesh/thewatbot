import mongoose from "mongoose";
import { Word, Query } from "./type.js";

const { model, Schema } = mongoose;

const Query = new Schema(
  {
    query: String,
    wordIds: {
      type: [Schema.Types.ObjectId],
    },
  },
  { versionKey: false }
);

export const QueryModel = model<Query>("Query", Query);

const Word = new Schema(
  {
    word: String,
    phonetic: String,
    origin: String,
    partOfSpeech: String,
    synonyms: String,
    antonyms: String,
    definition: String,
    example: String,
  },
  {
    versionKey: false,
  }
);

export const WordModel = model<Word>("Word", Word);
