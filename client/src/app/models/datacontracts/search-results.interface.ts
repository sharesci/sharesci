import { Author } from '../entities/author.entity.js'

export interface ISearchResults {
    errno: number
    errstr: string
    numResults: number
    results: [{
        _id: string,
        authors: [Author],
        title: string,
        score: number
    }]
}