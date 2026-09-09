import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { and, eq } from 'drizzle-orm';
import { Board, boards } from '../db/schema';
import { BoardErrorCode } from './constants/board-error-codes.constant';

@Injectable()
export class BoardsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async create(
    workspaceId: string,
    userId: string,
    createBoardDto: CreateBoardDto,
  ): Promise<Board> {
    const existing = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.title, createBoardDto.title.trim()),
      ),
    });

    if (existing) {
      throw new ConflictException('A board with this title already exists', {
        errorCode: BoardErrorCode.ALREADY_EXISTS,
      });
    }

    const hasAnyBoard = await this.db.query.boards.findFirst({
      where: eq(boards.workspaceId, workspaceId),
    });

    const [newBoard] = await this.db
      .insert(boards)
      .values({
        workspaceId,
        userId,
        ...createBoardDto,
        title: createBoardDto.title.trim(),
        isDefault: !hasAnyBoard,
      })
      .returning();

    return newBoard;
  }

  findAllByWorkspace(workspaceId: string): Promise<Board[]> {
    return this.db.query.boards.findMany({
      where: eq(boards.workspaceId, workspaceId),
    });
  }

  async findOne(id: string, workspaceId: string): Promise<Board> {
    const board = await this.db.query.boards.findFirst({
      where: and(eq(boards.id, id), eq(boards.workspaceId, workspaceId)),
    });

    if (!board) {
      throw new NotFoundException('Board not found in this workspace', {
        errorCode: BoardErrorCode.NOT_FOUND,
      });
    }

    return board;
  }

  async findDefault(workspaceId: string): Promise<Board> {
    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.isDefault, true),
      ),
    });

    if (!board) {
      throw new NotFoundException('No default board found in this workspace', {
        errorCode: BoardErrorCode.NOT_FOUND,
      });
    }

    return board;
  }

  async setDefault(id: string, workspaceId: string): Promise<Board> {
    await this.findOne(id, workspaceId);

    return this.db.transaction(async (tx) => {
      await tx
        .update(boards)
        .set({ isDefault: false })
        .where(
          and(eq(boards.workspaceId, workspaceId), eq(boards.isDefault, true)),
        );

      const [updated] = await tx
        .update(boards)
        .set({ isDefault: true })
        .where(and(eq(boards.id, id), eq(boards.workspaceId, workspaceId)))
        .returning();

      return updated;
    });
  }

  async update(
    id: string,
    workspaceId: string,
    updateBoardDto: UpdateBoardDto,
  ): Promise<Board> {
    await this.findOne(id, workspaceId);

    const [updatedBoard] = await this.db
      .update(boards)
      .set(updateBoardDto)
      .where(and(eq(boards.id, id), eq(boards.workspaceId, workspaceId)))
      .returning();

    return updatedBoard;
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    const board = await this.findOne(id, workspaceId);

    if (board.isDefault) {
      throw new ConflictException(
        'Cannot delete the default board. Set another board as default first.',
        { errorCode: BoardErrorCode.CANNOT_DELETE_DEFAULT },
      );
    }

    await this.db
      .delete(boards)
      .where(and(eq(boards.id, id), eq(boards.workspaceId, workspaceId)));

    return { message: 'Board deleted successfully' };
  }

  // Portal

  async findPublicByWorkspace(workspaceId: string) {
    return this.db.query.boards.findMany({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }

  async findPublicDefault(workspaceId: string) {
    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
        eq(boards.isDefault, true),
      ),
    });

    if (!board) {
      throw new NotFoundException('Default board not found');
    }

    return board;
  }

  async findPublicOne(id: string, workspaceId: string) {
    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.id, id),
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }
}
