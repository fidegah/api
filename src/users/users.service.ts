import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { and, eq, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { User, users } from '../db/schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly storageService: StorageService,
  ) {}

  async verifyEmail(userId: string): Promise<void> {
    await this.findById(userId);

    await this.db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const [newUser] = await this.db
      .insert(users)
      .values({
        ...createUserDto,
        password: hashedPassword,
      })
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...authenticatedUser } = newUser;

    return authenticatedUser;
  }

  async createFromOtp(email: string) {
    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        password: null,
        emailVerified: true,
      })
      .returning();

    return newUser;
  }

  async createFromOAuth(data: {
    email: string;
    fullName: string;
    avatarUrl?: string;
  }) {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      return existingUser;
    }

    const [newUser] = await this.db
      .insert(users)
      .values({ ...data, password: null, emailVerified: true })
      .returning();

    return newUser;
  }

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id);

    const [updatedUser] = await this.db
      .update(users)
      .set({
        ...updateUserDto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...user } = updatedUser;

    return user;
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const currentUser = await this.findById(userId);

    const uploaded = await this.storageService.uploadFile(
      'public',
      'avatars',
      file,
    );

    await this.db
      .update(users)
      .set({ avatarUrl: uploaded.url, updatedAt: new Date() })
      .where(eq(users.id, userId));

    if (currentUser.avatarUrl?.includes('arvanstorage.ir')) {
      const oldKey = new URL(currentUser.avatarUrl).pathname.slice(1);
      await this.storageService.deleteFile('public', oldKey).catch(() => {});
    }

    return { avatarUrl: uploaded.url! };
  }

  async remove(id: string) {
    await this.findById(id);

    const [deletedUser] = await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    const user = { ...deletedUser };
    delete (user as { password?: string }).password;

    return user;
  }

  async hardDeleteByEmail(email: string): Promise<void> {
    await this.db.delete(users).where(eq(users.email, email));
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
