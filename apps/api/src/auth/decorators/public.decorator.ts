import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает маршрут как не требующий JWT — JwtAuthGuard его пропускает. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
