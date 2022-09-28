import { AES, enc, HmacSHA256 } from "crypto-js"

export namespace KDF{
    export type KDFType = (val: string, key: string)=> string;

    export function default_hash(val: string, key: string): string{
        return HmacSHA256(val, key).toString(enc.Base64)
        //return HmacSHA256(val, process.env.SECRET_KEY!).toString(enc.Base64)
    }
}


export namespace Encryption{
    export type EncryptionType = {
       encrypt: (val: string, key: string)=> string;
       decrypt: (val: string, key: string)=> string;
    }

    export const defaultEncryption: EncryptionType= {
        encrypt: (val, key) => AES.encrypt(val, key).toString(),
        decrypt: (val, key) => AES.decrypt(val, key).toString(enc.Utf8)
    }

}