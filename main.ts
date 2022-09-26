import { MongoClient } from "mongodb";
import * as dotenv from "dotenv"
import { exit } from "process";
import { timeFun, timeMethod } from "./src/utils";
import { Scheme1Index } from "./src/fieldIndexes/Scheme1Index";
import { Scheme2Index } from "./src/fieldIndexes/Scheme2Index";
import { Scheme4Index } from "./src/fieldIndexes/Scheme4Index";
import { PlainMovieRepository } from "./src/movieRepositories/plain-movie.repository";
import { Scheme0MovieRepository } from "./src/movieRepositories/scheme_0-movie.repository";
import { Scheme1MovieRepository } from "./src/movieRepositories/scheme_1-movie.repository";
import { Scheme2MovieRepository } from "./src/movieRepositories/scheme_2-movie.repository";
import { Scheme4MovieRepository } from "./src/movieRepositories/scheme_4-movie.reository";
import { Movie } from "./src/model/movie.model";
import { MovieRepository } from "./src/movieRepositories/movie.repository";
import { add_pseudo_increment_field, encAESField } from "./src/initilizeSchemes";


Error.stackTraceLimit = 20

main()

async function main(){

    dotenv.config({ path:'./.env' })
    //plain_to_scheme1("PoC-mflix-scheme1","movies","title","title_hash")

    /*
    let client = await MongoClient.connect(process.env.MONGODB_URI!);
    await encAESField(client,'PoC-mflix-enc','movies','genres')
    console.log('generi cifrati')
    await encAESField(client,'PoC-mflix-enc','movies','title')
    console.log('titoli cifrati')
    await add_pseudo_increment_field("PoC-mflix-enc","movies")
    console.log('aggiunto valore incrementale')
    */

    await cleanIndex()

    let inputs={
        id:'573a1390f29313caabcd4eaf',
        title:'Peter Pan',
        genre:'History'
    }
    await test(inputs)

    
    exit()
}
async function cleanIndex(){
    let client = await MongoClient.connect(process.env.MONGODB_URI!);
    let collNames = (await client.db('PoC-mflix-enc').listCollections().toArray()).map(c => c.name)

    
    console.log(await client.db('PoC-mflix-enc').collection('movies').dropIndexes())
    console.log(await client.db('PoC-mflix-enc').collection('movies').createIndex({_id:1}))
    console.log(await client.db('PoC-mflix-enc').collection('movies').createIndex({inc:1}))
    console.log(await client.db('PoC-mflix-enc').collection('movies').updateMany({},{$unset: {title_index_1: "", genre_index_1:""}}))
    //console.log(collNames)

    if(collNames.includes('title_index_2'))
        console.log(await client.db('PoC-mflix-enc').dropCollection('title_index_2'))
    if(collNames.includes('genre_index_2'))
        console.log(await client.db('PoC-mflix-enc').dropCollection('genre_index_2'))

    if(collNames.includes('title_index_4'))
        console.log(await client.db('PoC-mflix-enc').dropCollection('title_index_4'))
    if(collNames.includes('genre_index_4'))
        console.log(await client.db('PoC-mflix-enc').dropCollection('genre_index_4'))
}
async function test(inputs: {id: string; title: string; genre:string}){
    let client = await MongoClient.connect(process.env.MONGODB_URI!);

    type Res = {
        value: any
        time: number
    } 
    let resP: Res
    let res0: Res
    let res1: Res
    let res2: Res
    let res4: Res

    console.log()
    console.log("BUILD INDEX TITLE")

    //res1 = await timeFun(Scheme1.buildIndex, client,'PoC-mflix-enc','movies','title','title_index_1',aes2string)
    res1 = await timeFun(Scheme1Index.buildIndex,
                    client.db('PoC-mflix-enc').collection('movies'),
                    'title', 
                    'title_index_1', 
                    process.env.SECRET_KEY!)
    console.log("BuildIndex s1_DB:  "+ res1.time+" ms")

    //res2 = await timeFun(Scheme2.buildIndex, client,'PoC-mflix-enc','movies','title','title_index_2',aes2string)
    res2 = await timeFun(Scheme2Index.buildIndex,
        client.db('PoC-mflix-enc').collection('movies'),
        'title',
        client.db('PoC-mflix-enc').collection('title_index_2'),
        process.env.SECRET_KEY!)
    console.log("BuildIndex s2_DB:  "+res2.time+" ms")

    //res4 = await timeFun(Scheme4.buildIndex, client,'PoC-mflix-enc','movies','title','title_index_4',aes2string)
    res4 = await timeFun(Scheme4Index.buildIndex,
        client.db('PoC-mflix-enc').collection('movies'),
        'title',
        client.db('PoC-mflix-enc').collection('title_index_4'),
        process.env.SECRET_KEY!
    )
    console.log("BuildIndex s4_DB:  "+res4.time+" ms")
    let titleFileCnt= res4.value

    console.log()
    console.log("BUILD INDEX GENRES")

    //res1 = await timeFun(Scheme1.buildIndex, client,'PoC-mflix-enc','movies','genres','genre_index_1',aes2stringArr)
    res1 = await timeFun(Scheme1Index.buildIndex,
        client.db('PoC-mflix-enc').collection('movies'),
        'genres', 
        'genre_index_1', 
        process.env.SECRET_KEY!)
    console.log("BuildIndex s1_DB:  "+ res1.time+" ms")

    //res2 = await timeFun(Scheme2.buildIndex, client,'PoC-mflix-enc','movies','genres','genre_index_2',aes2stringArr)
    res2 = await timeFun(Scheme2Index.buildIndex,
        client.db('PoC-mflix-enc').collection('movies'),
        'genres',
        client.db('PoC-mflix-enc').collection('genre_index_2'),
        process.env.SECRET_KEY!)
    console.log("BuildIndex s2_DB:  "+res2.time+" ms")

    //res4 = await timeFun(Scheme4.buildIndex, client,'PoC-mflix-enc','movies','genres','genre_index_4',aes2stringArr)
    res4 = await timeFun(Scheme4Index.buildIndex,
        client.db('PoC-mflix-enc').collection('movies'),
        'genres',
        client.db('PoC-mflix-enc').collection('genre_index_4'),
        process.env.SECRET_KEY!
    )
    console.log("BuildIndex s4_DB:  "+res4.time+" ms")
    let genreFileCnt= res4.value

    

    let repos: Map<string, MovieRepository> = new Map<string, MovieRepository>()

    repos.set("repo_plain", new PlainMovieRepository(client, "PoC-mflix-plain","movies"))
    repos.set("repo_s0", new Scheme0MovieRepository(client, "PoC-mflix-enc","movies"))
    repos.set("repo_s1", new Scheme1MovieRepository(client, "PoC-mflix-enc","movies"))
    repos.set("repo_s2", new Scheme2MovieRepository(client, "PoC-mflix-enc","movies"))
    repos.set("repo_s4", new Scheme4MovieRepository(client, "PoC-mflix-enc","movies", titleFileCnt, genreFileCnt))

    let results: Record<string,TestSearchRes> = {}


    for (const [name, repo] of repos){
        console.log()
        console.log(name)
        let res = await testMovieRepo(repo,inputs)
        results[name] = res
        
    }
    //console.log(results)

    //CONTROLLO CHE I RISULTATI SIANO TUTTI UGUALI
    let correctId = inputs.id
    for(const repoName in results){
        let resultValue = results[repoName].idSearch.value as Movie
        if(resultValue._id.toString() != correctId)
            console.error("Errore in ID SEARCH utilizzando la repo: "+ repoName)
    }

    let correctIdsForTitle = results.repo_plain.titleSearch.value.map((m: Movie)=>m._id.toString()).sort().join()
    for(const repoName in results){
        let resultValue = results[repoName].titleSearch.value as Movie[]
        
        if(resultValue.map(m=>m._id.toString()).sort().join() != correctIdsForTitle)
            console.error("Errore in TITLE SEARCH utilizzando la repo: "+ repoName)
    }

    let correctIdsForGenre = results.repo_plain.genreSearch.value.map((m: Movie)=>m._id.toString()).sort().join()
    for(const repoName in results){
        let resultValue = results[repoName].genreSearch.value as Movie[]
        
        if(resultValue.map(m=>m._id.toString()).sort().join() != correctIdsForGenre)
            console.error("Errore in GENRE SEARCH utilizzando la repo: "+ repoName)
    }


    
    let resFix  = Object.keys(results).reduce<Record<string,any>>(
        (acc1, k1) => {
            acc1[k1] = Object.keys(results[k1]).reduce<Record<string,any>>(
                (acc2, k2) => {
                    acc2[k2] = (results as  Record<string,any>)[k1][k2].time.toFixed(2) + ' ms'
                    
                    return acc2;
                },
                {} as object
            );
            return acc1;
        },
        {} as object
      );

    //Object.keys({}).reduce((a, e) => { a[e] = obj[e]; return a; }, {});


    console.log(resFix)
    console.table(resFix)
    
    /*console.log("SEARCH BY ID (PLAIN)")

    resP = await timeMethod(repo_plain, PlainMovieRepository.prototype.getMovieById, id)
    console.log("plain   : "+ resP.time+" ms")

    res0 = await timeMethod(repo_s0,    Scheme0MovieRepository.prototype.getMovieById, id)
    console.log("scheme 0: "+res0.time+" ms")

    res1 = await timeMethod(repo_s1,    Scheme1MovieRepository.prototype.getMovieById, id)
    console.log("scheme 1: "+res1.time+" ms")

    res2 = await timeMethod(repo_s2,    Scheme2MovieRepository.prototype.getMovieById, id)
    console.log("scheme 2: "+res2.time+" ms")

    res4 = await timeMethod(repo_s4,    Scheme2MovieRepository.prototype.getMovieById, id)
    console.log("scheme 4: "+res4.time+" ms")
    
    
    if(resP.value._id.toString()==res0.value._id.toString() && res0.value._id.toString()==res1.value._id.toString() && res1.value._id.toString()==res2.value._id.toString() && res2.value._id.toString()==res4.value._id.toString())
        console.log("Valori uguali")
    else{
        console.log("!!!! LE QUERY HANNO RITORNATO VALORI DIVERSI !!!")
        console.log(resP.value._id.toString())
        console.log(res0.value._id.toString())
        console.log(res1.value._id.toString())
        console.log(res2.value._id.toString())
        console.log(res4.value._id.toString())
    }

    console.log();
    console.log("SEARCH BY TITLE")


    resP = await timeMethod(repo_plain, PlainMovieRepository.prototype.getAllMoviesByTitle, title)
    console.log("plain   : "+ resP.time+" ms")

    res0 = await timeMethod(repo_s0,    Scheme0MovieRepository.prototype.getAllMoviesByTitle, title)
    console.log("scheme 0: "+res0.time+" ms")

    res1 = await timeMethod(repo_s1,    Scheme1MovieRepository.prototype.getAllMoviesByTitle, title)
    console.log("scheme 1: "+ res1.time+" ms")
    
    res2 = await timeMethod(repo_s2,    Scheme2MovieRepository.prototype.getAllMoviesByTitle, title)
    console.log("scheme 2: "+ res2.time+" ms")   
    
    res4 = await timeMethod(repo_s4,    Scheme4MovieRepository.prototype.getAllMoviesByTitle, title)
    console.log("scheme 4: "+ res4.time+" ms")

    
    
    if(equals(resP.value.map( (el: Movie) =>  el._id.toString()), res0.value.map( (el: Movie) =>  el._id.toString())) &&
        equals(res0.value.map( (el: Movie) =>  el._id.toString()), res1.value.map( (el: Movie) =>  el._id.toString())) &&
        equals(res1.value.map( (el: Movie) =>  el._id.toString()),res2.value.map( (el: Movie) =>  el._id.toString())) &&
        equals(res2.value.map( (el: Movie) =>  el._id.toString()),res4.value.map( (el: Movie) =>  el._id.toString())))
        console.log("Valori uguali")
    else{
        console.log("!!!! LE QUERY HANNO RITORNATO VALORI DIVERSI !!!")
        console.log(resP.value.map( (el: Movie) =>  el._id.toString() ))
        console.log(res0.value.map( (el: Movie) =>  el._id.toString() ))
        console.log(res1.value.map( (el: Movie) => el._id.toString() )) 
        console.log(res2.value.map( (el: Movie) => el._id.toString() )) 
        console.log(res4.value.map( (el: Movie) => el._id.toString() )) 
    }

    console.log();
    console.log("SEARCH BY GENRE")

    
    resP = await timeMethod(repo_plain, PlainMovieRepository.prototype.getAllMoviesByGenre, genre)
    console.log("plain   : "+ resP.time+" ms")

    res0 = await timeMethod(repo_s0,    Scheme0MovieRepository.prototype.getAllMoviesByGenre, genre)
    console.log("scheme 0: "+res0.time+" ms")

    res1 = await timeMethod(repo_s1,    Scheme1MovieRepository.prototype.getAllMoviesByGenre, genre)
    console.log("scheme 1: "+ res1.time+" ms")
    
    res2 = await timeMethod(repo_s2,    Scheme2MovieRepository.prototype.getAllMoviesByGenre, genre)
    console.log("scheme 2: "+ res2.time+" ms")
    
    res4 = await timeMethod(repo_s4,    Scheme4MovieRepository.prototype.getAllMoviesByGenre, genre)
    console.log("scheme 4: "+ res4.time+" ms")
  
    if(resP.value.length == res0.value.length && res0.value.length == res1.value.length && res1.value.length == res2.value.length && res2.value.length == res4.value.length)//equals(resP.value.map( (el: Movie) =>  el._id.toString()), res2.value.map( (el: Movie) =>  el._id.toString())))
        console.log("Valori uguali")
    else{
        console.log("!!!! LE QUERY HANNO RITORNATO VALORI DIVERSI !!!")
        console.log(resP.value.length +" vs "+ res0.value.length +" vs "+ res1.value.length +" vs "+ res2.value.length +" vs "+ res4.value.length)
        console.log(resP.value.map( (el: Movie) => el._id.toString() ))
        console.log(res0.value.map( (el: Movie) => el._id.toString() ))
        console.log(res1.value.map( (el: Movie) => el._id.toString() ))
        console.log(res2.value.map( (el: Movie) => el._id.toString() )) 
        console.log(res4.value.map( (el: Movie) => el._id.toString() )) 
    }
*/


}



function equals(array1: any[], array2: any[]){
    return (array1.length == array2.length) && array1.every(function(element, index) {
        return element === array2[index]; 
    });
}

type TestSearchRes = {
    idSearch:    TestResult;
    titleSearch: TestResult;
    genreSearch: TestResult;
}
type TestResult = {
    value:any;
    time:number
}
async function testMovieRepo(repo: MovieRepository, inputs: {id:string; title:string; genre:string}): Promise<TestSearchRes>{
    let results: Record<string, TestResult> = {}

    results.idSearch = await timeMethod(repo, PlainMovieRepository.prototype.getMovieById, inputs.id)
    results.titleSearch = await timeMethod(repo, PlainMovieRepository.prototype.getAllMoviesByTitle, inputs.title)
    results.genreSearch = await timeMethod(repo, PlainMovieRepository.prototype.getAllMoviesByGenre, inputs.genre)

    //console.log(results)


    return results as TestSearchRes
}

/*
function project(obj: object, projection: object): object {
    return Object.keys(projection).reduce((a, e) => { a[e] = obj[e]; return a; }, {});
}*/