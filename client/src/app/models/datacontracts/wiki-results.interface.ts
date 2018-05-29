export interface IWikiResults {
    errno: number
    errstr: string
    wikiresults: [{
        _id: string,
        title: string,
        url: string
    }]
}