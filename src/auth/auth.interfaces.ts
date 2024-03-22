export interface IVerificationRepository {
    email: string;
    code: string;
    expiryDate: Date;
}
