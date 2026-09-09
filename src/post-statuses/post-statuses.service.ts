import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { postStatuses } from '../db/schema';

@Injectable()
export class PostStatusesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  findAll() {
    return this.db.query.postStatuses.findMany({
      orderBy: [asc(postStatuses.order)],
    });
  }
}
