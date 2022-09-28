import { WithId, Document, FindCursor, Collection, MongoClient, AnyBulkWriteOperation } from "mongodb";
import { FieldIndex } from "./FieldIndex";
import { Encryption, KDF } from "./Functions";

export class Scheme1Index implements FieldIndex {

    private readonly collection: Collection<Document>;
	private readonly indexField: string;
	private readonly hashFun: KDF.KDFType;
    private readonly hashFunKey: string;

	constructor(
		collection: Collection<Document>,
		indexField: string,
        hashFunKey: string,
        hashFun: KDF.KDFType = KDF.default_hash) {

		this.collection = collection;
		this.indexField = indexField;
		this.hashFun = hashFun;
		this.hashFunKey = hashFunKey;

	}


    public static async buildIndex(
            collection: Collection<Document>,
            fieldToIndex: string,
            hashField: string,
            key: string): Promise<void>
    public static async buildIndex(
            collection: Collection<Document>,
            fieldToIndex: string,
            hashField: string,
            fieldEncryptionKey: string,
            hashFunKey?: string,
            fieldEncryption: Encryption.EncryptionType = Encryption.defaultEncryption,
            hashFun: KDF.KDFType = KDF.default_hash): Promise<void>{

        
        if(hashFunKey==undefined)
            hashFunKey = fieldEncryptionKey

        let records = collection.find()
                        .project({ [fieldToIndex]: 1 });

        let updates = new Array<AnyBulkWriteOperation<Document>>()
        await records.forEach(function (value) {
            //console.log(value);
            if(value[fieldToIndex] != undefined){

                let plainValue = fieldEncryption.decrypt(value[fieldToIndex], fieldEncryptionKey).split(',')

                let hashedValue = plainValue.map(val => hashFun(val, hashFunKey!))

                updates.push({ updateOne:{
                                filter: {_id: value['_id']},
                                update: {$set: { [hashField]: hashedValue }}
                            }})
            }
        });
        
        await collection.bulkWrite(updates)
    }

    public getDocByFieldValue(value: any): Promise<WithId<Document> | null> {        
        let valueHash = this.hashFun(value.toString(), this.hashFunKey)

        return  this.collection
            .findOne({ [this.indexField]: valueHash })
    }

    public getAllDocsByFieldValue(value: any): FindCursor<WithId<Document>> {     
        let valueHash = this.hashFun(value.toString(), this.hashFunKey)

        return  this.collection
            .find({ [this.indexField]: valueHash })
    }

    public getAllDocsByFieldValues(values: any[]): FindCursor<WithId<Document>> {
        let valuesHash = values.map(val => this.hashFun(val.toString(), this.hashFunKey))

        return this.collection
            .find({ [this.indexField]: {$in: valuesHash}})
    }
}