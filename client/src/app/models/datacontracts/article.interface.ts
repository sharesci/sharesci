import { Article } from '../entities/article.entity.js'

export interface IArticle {
    errno: number
    articleJson: Article
}
