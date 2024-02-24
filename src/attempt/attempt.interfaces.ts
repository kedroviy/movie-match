import { AttemptType } from "@src/attempt/attempt.model";

export interface AttemptTypes {
    userId: string,
    where: AttemptType,
    userAgent: string,
}