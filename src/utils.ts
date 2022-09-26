import { enc } from "crypto-js";
import { performance } from "perf_hooks";


export async function timeFun<Output>(fun: (...aa: any[]) => Output, ...args: any[]) {
    var startTime = performance.now()
    let val=await fun.call(null,...args)   // <---- The function you're measuring time for
    var endTime = performance.now()

    return  {value: val, time: endTime-startTime}
}

export async function timeMethod<Input,Output>(obj: Object, met: (arg: Input) => Output, arg: Input) {
    var startTime = performance.now()
    let val=await met.call(obj, arg)   // <---- The function you're measuring time for
    var endTime = performance.now()

    

    return  {value: val, time: endTime-startTime}
}




export function b64ToBn(b64: string): bigint{
    let hex = enc.Hex.stringify(enc.Base64.parse(b64))   
    return BigInt('0x' + hex);
}
export function bnToB64(bn: bigint): string {
    let b64 = enc.Base64.stringify(enc.Hex.parse(bn.toString(16)))
    return b64;
}