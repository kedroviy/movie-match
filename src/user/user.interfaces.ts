import { ClientType } from './user.model';

export interface CheckUserExistenceParams {
    username?: string;
    email?: string;
}

export interface CreateUser {
    email: string;
    password?: string;
    client?: ClientType;
}

export interface GetUser {
    id: number;
    email: string;
}
