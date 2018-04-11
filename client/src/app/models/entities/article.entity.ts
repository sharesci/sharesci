import { Author } from './author.entity'

export class Article {
    _id: string = ''
    created: Date = new Date()
    authors: [Author]
    title: string = ''
    abstract: string = ''
    references: [any]
    other: any
}
