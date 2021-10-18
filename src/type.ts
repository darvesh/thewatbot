export type APIResponse = {
  word: string;
  phonetic: string;
  origin: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }[];
  }[];
};

export type Query = {
  id: string;
  query: string;
  wordIds: string[];
};

export type Word = {
  _id: string;
  word: string;
  phonetic: string;
  origin: string;
  partOfSpeech: string;
  synonyms: string;
  antonyms: string;
  definition: string;
  example: string;
};
