import { Inject, Injectable } from '@nestjs/common';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { ChangelogTag } from '../db/schema';

@Injectable()
export class ChangelogTagsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findAll(): Promise<ChangelogTag[]> {
    return this.db.query.changelogTags.findMany({
      orderBy: (tags, { asc }) => [asc(tags.order)],
    });
  }
}
