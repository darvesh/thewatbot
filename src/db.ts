import { Mongoose, ConnectOptions } from "mongoose";

import { Word } from "./type";
import { QueryModel, WordModel } from "./schema.js";

export class Db {
	constructor(mongoose: Mongoose, uri: string, dbOptions?: ConnectOptions) {
		mongoose.connect(uri, dbOptions);
	}

	insertQuery(query: string, wordIds: string[]) {
		return QueryModel.create({ query, wordIds });
	}

	insertWords(words: Omit<Word, "_id">[]) {
		return Promise.all(
			words.map((word) =>
				WordModel.findOneAndUpdate(
					{ word: word.word, definition: word.definition },
					{ $set: word },
					{ upsert: true, new: true }
				).lean()
			)
		);
	}

	async findWords(query: string) {
		const result = await QueryModel.findOne({ query }, { _id: 0, wordIds: 1 });
		if (!result) return null;
		return WordModel.find({ _id: { $in: result.wordIds } }).lean();
	}
}
