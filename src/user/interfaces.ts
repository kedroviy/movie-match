import { ClientType } from "./user.model";

export interface CheckUserExistenceParams {
    username?: string;
    email?: string;
}

export interface CreateUser {
    email: string;
    username: string;
    password?: string;
    client?: ClientType;
}