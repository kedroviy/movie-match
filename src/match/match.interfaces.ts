import { Room } from '@src/rooms/rooms.model';

export interface Match {
    id: number;
    movieId: string[];
    userId: number;
    roomKey: string;
    userName: string;
    role: string;
    vote: boolean;
    roomId: string;
    userStatus: string;
    room: Room;
    users: any;
}

export interface MatchError {
    error: string;
}

export type MatchResult = Match | MatchError;

export interface MatchResponse {
    id?: number;
    movieId?: string[];
    userId?: number;
    roomKey?: string;
    roomId?: string;
    vote?: boolean;
    userName?: string;
    role?: string;
    userStatus?: string;
    message?: string;
}
