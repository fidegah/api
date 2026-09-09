import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TagsApiKeyController } from './tags-api-key.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [TagsController, TagsApiKeyController],
  providers: [TagsService],
})
export class TagsModule {}
