import { forwardRef, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { SpamCheckService } from './spam-check.service';
import { PostCommentsModule } from '../post-comments/post-comments.module';
import { CommentSummaryService } from './comment-summary.service';

@Module({
  imports: [forwardRef(() => PostCommentsModule)],
  providers: [AiService, SpamCheckService, CommentSummaryService],
  exports: [SpamCheckService, CommentSummaryService],
})
export class AiModule {}
