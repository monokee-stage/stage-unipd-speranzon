import { WithId, Document, FindCursor, Collection } from "mongodb";
import { FieldIndex } from "./FieldIndex";

export class PlainNoIndex implements FieldIndex{

    private readonly collection: Collection<Document>;
	private readonly valueField: string;

	constructor(
		collection: Collection<Document>,
		valueField: string) {


		this.collection = collection;
		this.valueField = valueField;

	}



    getDocByFieldValue(value: any): Promise<WithId<Document> | null> {
        return this.collection
                    .findOne({ [this.valueField]: value })
    }
    getAllDocsByFieldValue(value: any): FindCursor<WithId<Document>> {
        return this.collection
                    .find({ [this.valueField]: value})
    }
    getAllDocsByFieldValues(values: any[]): FindCursor<WithId<Document>> {
        return this.collection
                    .find({ [this.valueField]: {$in: values} })
    }

} 