import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class SocketJwtGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient<Socket>();
            const token = client.handshake?.headers?.authorization;

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET
            });

            if (!token || !payload) {
                throw new WsException('Unauthorized');
            }

            client.handshake.auth.user = payload;

            return true;
        } catch (err) {
            throw new WsException(err.message);
        }
    }
}
