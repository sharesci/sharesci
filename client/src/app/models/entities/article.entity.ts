import { Author } from './author.entity'

export class Article {
    _id: string = ''
    created: Date = new Date()
    updated: Date = new Date()
    authors: [Author]
    title: string = ''
    comments: string = ''
    'msc-class': string = ''
    'journal-ref': string = ''
    doi: string = ''
    license: string = ''
    abstract: string = ''
    arXiv_id: string = ''
    references: [any]
    fulltext_text: string = ''
}