import { WithId, Document, FindCursor} from "mongodb";

export interface FieldIndex{

    getDocByFieldValue(value: any): Promise<WithId<Document> | null>

    getAllDocsByFieldValue(value: any): FindCursor<WithId<Document>> | Promise<FindCursor<WithId<Document>>>

    getAllDocsByFieldValues(values: any[]): FindCursor<WithId<Document>> | Promise<FindCursor<WithId<Document>>>
 
}
