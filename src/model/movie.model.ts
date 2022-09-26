import { ObjectId } from "bson";
import { generateKey } from "crypto";

export class Movie{
	//useful field
    _id: ObjectId;
	title: string;
    genres: Array<string>;

	//maybe useful field
    /*cast: Array<string>;
	languages: Array<string>;
	year: number;



	//useless
    plot: string;
    runtime: number;
    num_mflix_comments: number;
	poster : string;
	lastupdated: string;
	released: string; //meglio date
	directors: Array<string>
	rated: string;
	awards: object;
	imbd: object;
	countries: string;
	type: string;
	tomatoes: object;*/
	
    //key: DefaultCiphertextStructure;
    //passphrase?: DefaultCiphertextStructure;
    //pfx?: DefaultCiphertextStructure;

    constructor(_id: ObjectId, title: string, genres: Array<string>){
        this._id=_id;
        this.title= title;
        this.genres = genres
    }

	/*public static fromCompatibleSchema(config: Movie): Movie {
        let result = new Movie();
        for (const key in config) {
            if (Object.prototype.hasOwnProperty.call(config, key)) {
                result[key] = config[key];
            }
        }
        return result;
    }*/
		
}