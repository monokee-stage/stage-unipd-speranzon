import { WithId, Document, FindCursor, Collection, ObjectId } from "mongodb";
import { FieldIndex } from "./FieldIndex";
import { Encryption, KDF } from "./Functions";


export class Scheme2Index implements FieldIndex {

    private readonly idIndex: FieldIndex;
	private readonly indexCollection: Collection<Document>;
	private readonly hashFun: KDF.KDFType;
    private readonly hashFunKey: string;
    private readonly encryption: Encryption.EncryptionType;
    private readonly encryptionKey: string;

    constructor(idIndex: FieldIndex, indexCollection: Collection<Document>, key: string)
	constructor(
		idIndex: FieldIndex,
		indexCollection: Collection<Document>,
        hashFunKey: string,
        encryptionKey?: string,
        hashFun: KDF.KDFType = KDF.default_hash,
        encryption: Encryption.EncryptionType = Encryption.defaultEncryption) {

		this.idIndex = idIndex;
		this.indexCollection = indexCollection;
		this.hashFun = hashFun;
		this.hashFunKey = hashFunKey;
        this.encryption= encryption;

        if(encryptionKey == undefined)
            this.encryptionKey=hashFunKey
        else
            this.encryptionKey= encryptionKey;

	}


    public static async buildIndex(
            collection: Collection<Document>,
            fieldToIndex: string,
            indexCollection: Collection<Document>,
            key: string): Promise<void>    
    public static async buildIndex(
            collection: Collection<Document>,
            fieldToIndex: string,
            indexCollection: Collection<Document>,
            fieldEncryptionKey: string,
            indexKey: string): Promise<void>
    public static async buildIndex(
            collection: Collection<Document>,
            fieldToIndex: string,
            indexCollection: Collection<Document>,
            fieldEncryptionKey: string,
            hashFunKey?: string,
            indexEncryptionKey?: string,
            fieldEncryption: Encryption.EncryptionType = Encryption.defaultEncryption,
            hashFun: KDF.KDFType = KDF.default_hash,
            indexEncryption: Encryption.EncryptionType = Encryption.defaultEncryption): Promise<void>{

        
        if(hashFunKey==undefined)
            hashFunKey = fieldEncryptionKey
        if(indexEncryptionKey==undefined)
            indexEncryptionKey = hashFunKey


        let records = collection
            .find()
            .project({ [fieldToIndex]: 1 })
    
        let index = new Map<any, any[]>() //Non solo
    
        await records.forEach(function (value) {
            //console.log(value)
            let id = value['_id'].toString()
    
            if (value[fieldToIndex] !== undefined) {

                let plainField= fieldEncryption.decrypt(value[fieldToIndex], fieldEncryptionKey).split(',')
    
                plainField.forEach((kw: any) => {
                    if (!index.has(kw))
                        index.set(kw, [id]);
                    else
                        index.get(kw)!.push(id);
                })
                
            }
    
        });

        let arrayIndex: Array<object> = Array.from(index, ([key, value]) => {
            let keyword = hashFun(key.toString(), hashFunKey!)
            let docs = indexEncryption.encrypt(value.toString(), indexEncryptionKey!)
    
            return ({ keyword, docs });
        })
        //console.log(arrayIndex)
    
        await indexCollection
            .insertMany(arrayIndex)
        

    }   



    getDocByFieldValue(value: any): Promise<WithId<Document> | null> {
        throw new Error("Method not implemented.");
    }

    async getAllDocsByFieldValue(value: any): Promise<FindCursor<WithId<Document>>> {
        let valueHash = this.hashFun(value.toString(), this.hashFunKey)


		let record = await this.indexCollection
			            .findOne({ keyword: valueHash })
			
		if (record == null)
			throw new Error("Movie in "+this.indexCollection.collectionName+" with \"" + value + "\" (hash="+valueHash+") not found.");

		let encIds= record['docs']
		let ids = this.encryption.decrypt(encIds, this.encryptionKey).split(',')

        return this.idIndex.getAllDocsByFieldValues(ids.map((id: string)=>new ObjectId(id)))
    }

    async getAllDocsByFieldValues(values: any[]): Promise<FindCursor<WithId<Document>>> {

        let valuesHash = values.map((val) => this.hashFun(val.toString(),this.hashFunKey))

		let records = this.indexCollection
			            .find({ keyword: {$in: valuesHash}})
        
        let ids = new Set<string>()
        await records.forEach((rec) =>{
            this.encryption.decrypt(rec['docs'], this.encryptionKey).split(',').forEach(id => ids.add(id))
        })

        return this.idIndex.getAllDocsByFieldValues(
            Array.from(ids.values()).map((id)=>new ObjectId(id))
        )
    }
}