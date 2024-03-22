import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    return req.user;
});
