
import { Movie } from "../model/movie.model";
import { MovieRepository } from "./movie.repository"
import { MongoClientOptions, MongoClient, ObjectId } from "mongodb";
import { FieldIndex } from "../fieldIndexes/FieldIndex";
import { PlainNoIndex } from "../fieldIndexes/PlainNoIndex";
import { Scheme1Index } from "../fieldIndexes/Scheme1Index";


export class Scheme1MovieRepository extends MovieRepository {
	private client: MongoClient;
	private readonly db_collection: string;
	private readonly db_name: string;
	
	protected readonly idIndex: FieldIndex;
	protected readonly titleIndex: FieldIndex;
	protected readonly genreIndex: FieldIndex;

	constructor(
		client: MongoClient,
		db_name: string,
		db_collection: string) {

		super();


		this.client = client;
		this.db_name = db_name;
		this.db_collection = db_collection;


		this.idIndex = new PlainNoIndex(
			client.db(db_name).collection(db_collection),
			'_id'
		)
		this.titleIndex = new Scheme1Index(
			client.db(db_name).collection(db_collection),
			'title_index_1',
			process.env.SECRET_KEY!
		)
		this.genreIndex = new Scheme1Index(
			client.db(db_name).collection(db_collection),
			'genre_index_1',
			process.env.SECRET_KEY!
		)

	}

	/*
	public insertNewMovie(movie: Movie){
		let titleHash = HmacSHA256(movie.title, process.env.SECRET_KEY!).toString(enc.Base64)

		this.client
			.db(this.db_name)
			.collection(this.db_collection)
			.insertOne({title: movie.title, title_hash: titleHash, genres: movie.genres})
	}*/ 


}