import { ConflictException, Injectable } from '@nestjs/common';
import { Room, RoomStatus } from './rooms.model';
import { MatchPhase } from './match-phase.enum';
import { parseMoviesColumn } from './rooms.utils';

/** Named transitions the guard authorizes (see `assert*` methods). */
export enum RoomTransition {
    StartMatch = 'StartMatch',
    FetchNextDeckPage = 'FetchNextDeckPage',
    EnterExceptionShortlist = 'EnterExceptionShortlist',
    NarrowExceptionDeck = 'NarrowExceptionDeck',
    EnterFinalPick = 'EnterFinalPick',
}

@Injectable()
export class RoomStateMachineService {
    /** First deck load: lobby → swiping. Idempotent if match already started with a deck. */
    assertStartMatch(room: Room): void {
        if (room.matchPhase === MatchPhase.LOBBY && room.status === RoomStatus.PENDING) {
            return;
        }
        if (room.matchPhase === MatchPhase.SWIPING && room.status === RoomStatus.SET && this.hasDeckDocs(room)) {
            return;
        }
        throw new ConflictException(
            `Cannot start match from phase=${room.matchPhase} status=${room.status}`,
        );
    }

    /** Kinopoisk next page / new deck while swiping. */
    assertFetchNextDeck(room: Room): void {
        if (room.matchPhase === MatchPhase.SWIPING && (room.status === RoomStatus.SET || room.status === RoomStatus.EXCEPTION)) {
            return;
        }
        throw new ConflictException(
            `Cannot fetch next deck from phase=${room.matchPhase} status=${room.status}`,
        );
    }

    /** 8+ common likes → narrow shortlist (EXCEPTION). */
    assertEnterExceptionShortlist(room: Room): void {
        if (room.matchPhase === MatchPhase.SWIPING && room.status === RoomStatus.SET) {
            return;
        }
        throw new ConflictException(
            `Cannot enter exception shortlist from phase=${room.matchPhase} status=${room.status}`,
        );
    }

    /** Further narrow EXCEPTION deck. */
    assertNarrowExceptionDeck(room: Room): void {
        if (room.matchPhase === MatchPhase.SWIPING && room.status === RoomStatus.EXCEPTION) {
            return;
        }
        throw new ConflictException(
            `Cannot narrow exception deck from phase=${room.matchPhase} status=${room.status}`,
        );
    }

    /** Single common movie → final UI. */
    assertEnterFinalPick(room: Room): void {
        if (room.matchPhase === MatchPhase.SWIPING && (room.status === RoomStatus.SET || room.status === RoomStatus.EXCEPTION)) {
            return;
        }
        throw new ConflictException(
            `Cannot enter final pick from phase=${room.matchPhase} status=${room.status}`,
        );
    }

    /** Public for idempotent `startMatch` checks. */
    hasPlayableDeck(room: Room): boolean {
        return this.hasDeckDocs(room);
    }

    private hasDeckDocs(room: Room): boolean {
        const deck = parseMoviesColumn(room.movies) ?? room.movies;
        const docs = Array.isArray(deck) ? deck : (deck as any)?.docs;
        return Array.isArray(docs) && docs.length > 0;
    }
}
