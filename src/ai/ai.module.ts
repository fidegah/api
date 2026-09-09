import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { SpamCheckService } from './spam-check.service';
import { CommentSummaryService } from './comment-summary.service';

@Module({
  providers: [AiService, SpamCheckService, CommentSummaryService],
  exports: [SpamCheckService, CommentSummaryService],
})
export class AiModule {}
