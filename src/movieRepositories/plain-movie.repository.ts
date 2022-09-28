import { Movie } from "../model/movie.model";
import { MovieRepository } from "./movie.repository"
import { MongoClientOptions, MongoClient, ObjectId } from "mongodb";
import { FieldIndex } from "../fieldIndexes/FieldIndex";
import { PlainNoIndex } from "../fieldIndexes/PlainNoIndex";



export class PlainMovieRepository extends MovieRepository {
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
		this.titleIndex = new PlainNoIndex(
			client.db(db_name).collection(db_collection),
			'title'
		)
		this.genreIndex = new PlainNoIndex(
			client.db(db_name).collection(db_collection),
			'genres'
		)

	}

	




}