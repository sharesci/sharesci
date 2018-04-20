import { Comment } from '../entities/comment.entity'

export interface IComments {
    errno: number
    errstr: string
    results: [{
    	_id: string,
    	username: string,
    	date: string,
    	comment: string,
    	articleId: string
    }]
}
