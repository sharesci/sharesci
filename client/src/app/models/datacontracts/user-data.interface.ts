import { User } from '../entities/user.entity.js'

export interface IUserData {
    errno: number
    errstr: string
    userJson: User
}