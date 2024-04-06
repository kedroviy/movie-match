import { SetMetadata } from '@nestjs/common';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';

import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const { authorization }: any = request.headers;
            if (!authorization || authorization.trim() === '') {
                throw new UnauthorizedException('Please provide token');
            }
            const authToken = authorization.replace(/bearer/gim, '').trim();
            const resp = await this.authService.validateToken(authToken);
            request.decodedData = resp;
            return true;
        } catch (error) {
            let errorMessage: string = 'Session expired! Please sign in.';
            if (error instanceof Error) {
                console.log('Auth error - ', error.message);
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                console.log('Auth error - ', error);
                errorMessage = error;
            }
            throw new ForbiddenException(errorMessage);
        }
    }
}

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
