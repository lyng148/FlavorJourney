import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class ProfileOwnerGuard implements CanActivate {
    constructor() { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const userId = user?.id;
        const profileId = parseInt(request.body?.id);

        if (!userId || !profileId) {
            return false;
        }
        if (userId != profileId) {
            return false;
        }

        return true;
    }
}
