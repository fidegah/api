import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { postTags, Tag, tags } from '../db/schema';

@Injectable()
export class PostTagsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findTagsByPost(postId: string, workspaceId: string): Promise<Tag[]> {
    const result = await this.db
      .select({ tag: tags })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(
        and(eq(postTags.postId, postId), eq(postTags.workspaceId, workspaceId)),
      );

    return result.map((row) => row.tag);
  }

  async addTagToPost(postId: string, tagId: string, workspaceId: string) {
    const existing = await this.db.query.postTags.findFirst({
      where: and(eq(postTags.postId, postId), eq(postTags.tagId, tagId)),
    });

    if (existing) {
      throw new ConflictException('This tag is already added to the post');
    }

    const [postTag] = await this.db
      .insert(postTags)
      .values({ postId, tagId, workspaceId })
      .returning();

    return postTag;
  }

  async removeTagFromPost(postId: string, tagId: string, workspaceId: string) {
    const existing = await this.db.query.postTags.findFirst({
      where: and(
        eq(postTags.postId, postId),
        eq(postTags.tagId, tagId),
        eq(postTags.workspaceId, workspaceId),
      ),
    });

    if (!existing) {
      throw new NotFoundException('This tag is not attached to the post');
    }

    await this.db
      .delete(postTags)
      .where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagId)));

    return { message: 'Tag removed from post successfully' };
  }
}
