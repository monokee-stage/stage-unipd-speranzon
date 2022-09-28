import { Repository } from "../repository";
import { Movie } from "../model/movie.model";
import { FieldIndex } from "../fieldIndexes/FieldIndex";
import { ObjectId } from "mongodb";


export abstract class MovieRepository extends Repository {
    
	protected abstract idIndex: FieldIndex;
	protected abstract titleIndex: FieldIndex;
	protected abstract genreIndex: FieldIndex;

    /**
     * ....
     * @param _id Movie ID
     */
    public async getMovieById(_id: string): Promise<Movie>{
        let doc= await this.idIndex.getDocByFieldValue(new ObjectId(_id))

		if(doc==null)
			throw new Error("Movie with id =" + _id + " not found.");

		return new Movie(doc['_id'], doc['title'], doc['genres'])
    }

    /**
     * ...
     * @param _id Movie ID
     */
    public async getAllMoviesByTitle(title: string): Promise<Array<Movie>>{

        return  (await this.titleIndex.getAllDocsByFieldValue(title))
					.map(doc => 
						new Movie(doc['_id'], doc['title'], doc['genres'])
					).toArray()
    }

    /**
     * Gets the movies by genre
     * @param genre A genre of the movies
     */
    public async getAllMoviesByGenre(genre: string): Promise<Array<Movie>>{
        return  (await this.genreIndex.getAllDocsByFieldValue(genre))
					.map(doc => 
						new Movie(doc['_id'], doc['title'], doc['genres'])
					).toArray()
    }


}