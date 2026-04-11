/** High-level UX phase for the room aggregate (orthogonal to legacy RoomStatus). */
export enum MatchPhase {
    LOBBY = 'LOBBY',
    SWIPING = 'SWIPING',
    WAITING_ROUND = 'WAITING_ROUND',
    FINAL_PICK = 'FINAL_PICK',
}
