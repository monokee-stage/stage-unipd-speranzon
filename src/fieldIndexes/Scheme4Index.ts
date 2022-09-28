import randomBytesSeed from "@csquare/random-bytes-seed";
import { toBigIntBE } from "bigint-buffer";
import { WithId, Document, FindCursor, Collection, ObjectId } from "mongodb";
import { b64ToBn, bnToB64 } from "../utils";
import { FieldIndex } from "./FieldIndex";
import { Encryption, KDF } from "./Functions";




export class Scheme4Index implements FieldIndex {

    private readonly incrementIdIndex: FieldIndex;
	private readonly indexCollection: Collection<Document>;
    private readonly indexKey: string;
	private fileCnt: Map<string, number>;
	private dbSize: number;
	private readonly k: number;


	constructor(
		incrementIdIndex: FieldIndex,
		indexCollection: Collection<Document>,
        indexKey: string,
        fileCnt: Map<string, number>,
        dbSize: number,
        k: number) {


		this.incrementIdIndex = incrementIdIndex;
		this.indexCollection = indexCollection;
        this.indexKey = indexKey
		this.fileCnt = fileCnt;
		this.dbSize = dbSize;
        this.k = k;
	}

    public static async buildIndex(
        collection: Collection<Document>,
        fieldToIndex: string,
        indexCollection: Collection<Document>,
        key: string): Promise<Map<string, number>>
    public static async buildIndex(
            collection: Collection<Document>,
            fieldToIndex: string,
            indexCollection: Collection<Document>,
            fieldEncryptionKey: string,
            indexKey?: string,
            fieldEncryption: Encryption.EncryptionType = Encryption.defaultEncryption): Promise<Map<string, number>>{

        if(indexKey==undefined)
            indexKey = fieldEncryptionKey

        function F(...msgs: any[]): string{
            return KDF.default_hash(msgs.join(), indexKey!)
        }
        function G(seed: string, recNum: number): bigint{
            return toBigIntBE(randomBytesSeed(Math.ceil(recNum/8.0), seed))
        }

                
        let N = await collection.estimatedDocumentCount()
    
        let records = collection
            .find()
            .project({ [fieldToIndex]: 1, inc: 1 })
    
        let index = new Map<any, any[]>()
    
        await records.forEach(function (value) {
            //console.log(value)
            let inc = value['inc']
    
            if (value[fieldToIndex] !== undefined) {
    
                let plainField = fieldEncryption.decrypt(value[fieldToIndex], fieldEncryptionKey).split(',')

                plainField.forEach((kw: any) => {
                    if (!index.has(kw))
                        index.set(kw, [inc]);
                    else
                        index.get(kw)!.push(inc);
                })
            }
    
        });

    
        let fileCnt = new Map<string, number>()
        let indexRecords = Array<object>()
    
        index.forEach((incs: Array<any>, kw) => {
            fileCnt.set(kw, 0)
            //console.log(kw)

            let B_i = 0n
            
            incs.forEach((inc)=>{
                B_i += 2n ** BigInt(inc)
            })
    
            let loc = F(kw, fileCnt.get(kw)! * 2)
            let rnd = G(F(kw, fileCnt.get(kw)! * 2 + 1), N)
            let c = bnToB64(rnd ^ B_i)
    
            indexRecords.push( { loc: loc, c: c } )
        })

        await indexCollection
            .insertMany(indexRecords)

        return fileCnt
    }



    private F(...msgs: any[]): string{
        return KDF.default_hash(msgs.join(), this.indexKey)
    }
    private G(seed: string, recNum: number): bigint{
        return toBigIntBE(randomBytesSeed(Math.ceil(recNum/8.0), seed))
    }

    getDocByFieldValue(value: any): Promise<WithId<Document> | null> {
        throw new Error("Method not implemented.");
    }
    async getAllDocsByFieldValue(value: any): Promise<FindCursor<WithId<Document>>> {

        let records= await this.retrieveIndexRecs(value)
            
        let incs: number[] = []

        let kws = records.map(r=>r.kw)
        let B: bigint[] = []

        records.forEach((rec) => {
            let c = b64ToBn(rec.c)
            let rnd = this.G(this.F(value, this.fileCnt.get(value)! * 2 + 1), this.dbSize)

            let B_i = c ^ rnd;
            B.push(B_i)
            
            if (rec.kw == value) {
                incs = [...B_i.toString(2)].reverse().map((bit, i) => {
                    if (bit === '1')
                        return i
                    return undefined
                }).filter(Number) as number[]
                //console.log(incs)
            }
        })

        await this.updateIndex(kws, B)

        return this.incrementIdIndex.getAllDocsByFieldValues(incs)
    }
    getAllDocsByFieldValues(values: any[]): FindCursor<WithId<Document>> {
        throw new Error("Method not implemented.");
    }




    private async retrieveIndexRecs(keyword: string): Promise<{ kw: string; c: any; }[]>{
        let kws = Array.from(this.fileCnt.keys())

            const index = kws.indexOf(keyword, 0);
            if (index == -1) throw Error("keyword non esistente")
            kws.splice(index, 1);

            let kwsToReq = kws.sort(() => .5 - Math.random()).slice(0, this.k - 1);
            kwsToReq.push(keyword)

            let locs = kwsToReq.map((kw) => this.F(kw, this.fileCnt.get(kw)! * 2))

            let idsToDelete:ObjectId[] = []

            let records = (await this.indexCollection
                .find({ loc: { $in: locs } })
                .toArray())
                .map(rec =>{
                    idsToDelete.push(rec['_id'])
                    let kw= kwsToReq[locs.indexOf(rec['loc'])]
                    return {kw:kw, c: rec['c']}
                })

            await this.indexCollection
                .deleteMany({_id: {$in: idsToDelete}})

            return  records

    }

    private async updateIndex(kws: string[], B: bigint[]): Promise<void>{
        
        let newRecs = Array<object>()

        kws.forEach((kw, idx)=>{
            this.fileCnt.set(kw,this.fileCnt.get(kw)!+1)

            let loc= this.F(kw, this.fileCnt.get(kw)! * 2)

            let rnd= this.G(this.F(kw, this.fileCnt.get(kw)! * 2 + 1), this.dbSize)
            let c = bnToB64(rnd ^ B[idx])

            newRecs.push({loc: loc, c: c})
        })

        await this.indexCollection
            .insertMany(newRecs)

    }
}

