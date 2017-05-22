import { User } from '../entities/user.entity'

export interface IUserData {
    errno: number
    errstr: string
    userJson: User
}