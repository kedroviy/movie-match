import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const UserWS = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const client: Socket = context.switchToWs().getClient<Socket>();
    return client.handshake.auth.user;
});
