import { Author } from '../entities/author.entity'

export interface IRelatedDocs {
    errno: number
    errstr: string
    numResults: number
    results: [{
        _id: string,
        authors: [Author],
        title: string,
        abstract: string,
        score: number
    }]
}