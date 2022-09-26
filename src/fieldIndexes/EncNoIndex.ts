import { WithId, Document, FindCursor, Collection, ObjectId } from "mongodb";
import { FieldIndex } from "./FieldIndex";
import { Encryption } from "./Functions";




export class EncNoIndex implements FieldIndex{

    private readonly collection: Collection<Document>;
	private readonly valueField: string;
	private readonly encryption: Encryption.EncryptionType;
	private readonly encryptionKey: string;

    
	constructor(
		collection: Collection<Document>,
		valueField: string,
        encryptionKey: string,
        encryption: Encryption.EncryptionType = Encryption.defaultEncryption) {


		this.collection = collection;
		this.valueField = valueField;
		this.encryption = encryption;
		this.encryptionKey = encryptionKey;

	}



    getDocByFieldValue(value: any): Promise<WithId<Document> | null> {
        throw new Error("Method not implemented.");
    }
    async getAllDocsByFieldValue(value: any): Promise<FindCursor<WithId<Document>>> {
        let recs=  this.collection
            .find()
            .project({[this.valueField]:1})

        let ids: ObjectId[] = []
        await recs.forEach(rec=>{
            if(rec[this.valueField]!=undefined){
                let val = this.encryption.decrypt(rec[this.valueField], this.encryptionKey).split(',')
                if(val.includes(value))
                    ids.push(rec['_id'])
            }
        })

        return this.collection
            .find({_id: {$in: ids}})
    }
    getAllDocsByFieldValues(values: any[]): FindCursor<WithId<Document>> {
        throw new Error("Method not implemented.");
    }

} 