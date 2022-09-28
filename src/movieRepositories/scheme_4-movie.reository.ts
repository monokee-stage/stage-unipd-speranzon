
import { Movie } from "../model/movie.model";
import { MovieRepository } from "./movie.repository"
import { MongoClient } from "mongodb";
import { FieldIndex } from "../fieldIndexes/FieldIndex";
import { PlainNoIndex } from "../fieldIndexes/PlainNoIndex";
import { Scheme4Index } from "../fieldIndexes/Scheme4Index";


export class Scheme4MovieRepository extends MovieRepository {
	private client: MongoClient;
	private readonly db_collection: string;
	private readonly db_name: string;
	private genreIndexCnt: Map<string, number>
	private titleIndexCnt: Map<string, number>
	
	protected readonly idIndex: FieldIndex;
	protected readonly titleIndex: FieldIndex;
	protected readonly genreIndex: FieldIndex;

	constructor(
		client: MongoClient,
		db_name: string,
		db_collection: string,
		titleIndexCnt: Map<string, number>,
		genreIndexCnt: Map<string, number>) {

		super();


		this.client = client;
		this.db_name = db_name;
		this.db_collection = db_collection;

		this.titleIndexCnt=titleIndexCnt
		this.genreIndexCnt=genreIndexCnt

		this.idIndex = new PlainNoIndex(client.db(db_name).collection(db_collection), '_id')

		let incIndex =  new PlainNoIndex(client.db(db_name).collection(db_collection), 'inc')
		this.titleIndex = new Scheme4Index(
			incIndex,
			client.db(db_name).collection('title_index_4'),
			process.env.SECRET_KEY!,
			titleIndexCnt,
			23530,
			3
		)

		this.genreIndex = new Scheme4Index(
			incIndex,
			client.db(db_name).collection('genre_index_4'),
			process.env.SECRET_KEY!,
			genreIndexCnt,
			23530,
			3
		)

	}	


}