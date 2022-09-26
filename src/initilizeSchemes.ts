import { AES } from "crypto-js";
import { MongoClient,Document, AnyBulkWriteOperation } from "mongodb";



export async function add_pseudo_increment_field(db_name: string, db_collection: string) {
    let client = await MongoClient.connect(process.env.MONGODB_URI as string);
    let inc = 0

    let records = client
        .db(db_name)
        .collection(db_collection)
        .find()
        .project({ _id: 1 })   
    

    let updates = new Array<AnyBulkWriteOperation<Document>>()
    await records.forEach(function (rec) {
        updates.push({ updateOne:{
                        filter: {_id: rec['_id']},
                        update: {$set: { inc: inc++ }}
                    }})
    });

    await client
        .db(db_name)
        .collection(db_collection)
        .bulkWrite(updates)

}

export async function encAESField(client: MongoClient, db_name: string, db_collection: string, field_to_enc: string){
    let docs = client
            .db(db_name)
            .collection(db_collection)
            .find()
            .project({[field_to_enc]:1})


    let updates = new Array<AnyBulkWriteOperation<Document>>()
    await docs.forEach(function (doc) {
        if(doc[field_to_enc] != undefined) {
            let encVal = AES.encrypt(doc[field_to_enc].toString(), process.env.SECRET_KEY!).toString()
            updates.push({ updateOne:{
                            filter: {_id: doc['_id']},
                            update: {$set: {[field_to_enc]: encVal}}
                        }})
        }
    });

    await client
        .db(db_name)
        .collection(db_collection)
        .bulkWrite(updates)

}  




