import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { 
  getUsers,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  updateUserLastLogin,
  validateUserCredentials
} from '../handlers/users';
import { eq } from 'drizzle-orm';

const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  full_name: 'Test User',
  role: 'ADMIN',
  is_active: true,
};

const testUserInput2: CreateUserInput = {
  username: 'editor1',
  email: 'editor@example.com',
  password: 'editorpass456',
  full_name: 'Editor User',
  role: 'EDITOR',
  is_active: true,
};

describe('User Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a user with all fields', async () => {
      const result = await createUser(testUserInput);

      expect(result.username).toEqual('testuser');
      expect(result.email).toEqual('test@example.com');
      expect(result.full_name).toEqual('Test User');
      expect(result.role).toEqual('ADMIN');
      expect(result.is_active).toEqual(true);
      expect(result.password_hash).toEqual('hashed_testpassword123');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.last_login).toBeNull();
    });

    it('should save user to database', async () => {
      const result = await createUser(testUserInput);

      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].email).toEqual('test@example.com');
      expect(users[0].password_hash).toEqual('hashed_testpassword123');
    });

    it('should handle default values', async () => {
      const inputWithDefaults: CreateUserInput = {
        username: 'defaultuser',
        email: 'default@example.com',
        password: 'password123',
        full_name: 'Default User',
        role: 'EDITOR',
        is_active: true, // Explicitly provided to match Zod schema
      };

      const result = await createUser(inputWithDefaults);

      expect(result.is_active).toEqual(true);
      expect(result.role).toEqual('EDITOR');
    });
  });

  describe('getUsers', () => {
    it('should return empty array when no users exist', async () => {
      const result = await getUsers();
      expect(result).toEqual([]);
    });

    it('should return all users', async () => {
      await createUser(testUserInput);
      await createUser(testUserInput2);

      const result = await getUsers();

      expect(result).toHaveLength(2);
      expect(result.some(u => u.username === 'testuser')).toBe(true);
      expect(result.some(u => u.username === 'editor1')).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return null when user not found', async () => {
      const result = await getUserById(999);
      expect(result).toBeNull();
    });

    it('should return user when found', async () => {
      const created = await createUser(testUserInput);
      const result = await getUserById(created.id);

      expect(result).not.toBeNull();
      expect(result?.username).toEqual('testuser');
      expect(result?.email).toEqual('test@example.com');
    });
  });

  describe('getUserByUsername', () => {
    it('should return null when user not found', async () => {
      const result = await getUserByUsername('nonexistent');
      expect(result).toBeNull();
    });

    it('should return user when found', async () => {
      await createUser(testUserInput);
      const result = await getUserByUsername('testuser');

      expect(result).not.toBeNull();
      expect(result?.username).toEqual('testuser');
      expect(result?.email).toEqual('test@example.com');
    });
  });

  describe('getUserByEmail', () => {
    it('should return null when user not found', async () => {
      const result = await getUserByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return user when found', async () => {
      await createUser(testUserInput);
      const result = await getUserByEmail('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.username).toEqual('testuser');
      expect(result?.email).toEqual('test@example.com');
    });
  });

  describe('updateUser', () => {
    it('should return null when user not found', async () => {
      const updateInput: UpdateUserInput = {
        id: 999,
        full_name: 'Updated Name',
      };

      const result = await updateUser(updateInput);
      expect(result).toBeNull();
    });

    it('should update user fields', async () => {
      const created = await createUser(testUserInput);
      
      const updateInput: UpdateUserInput = {
        id: created.id,
        full_name: 'Updated Full Name',
        role: 'EDITOR',
        is_active: false,
      };

      const result = await updateUser(updateInput);

      expect(result).not.toBeNull();
      expect(result?.full_name).toEqual('Updated Full Name');
      expect(result?.role).toEqual('EDITOR');
      expect(result?.is_active).toEqual(false);
      expect(result?.username).toEqual('testuser'); // Unchanged
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    it('should update password hash when password provided', async () => {
      const created = await createUser(testUserInput);
      
      const updateInput: UpdateUserInput = {
        id: created.id,
        password: 'newpassword123',
      };

      const result = await updateUser(updateInput);

      expect(result).not.toBeNull();
      expect(result?.password_hash).toEqual('hashed_newpassword123');
    });

    it('should update database record', async () => {
      const created = await createUser(testUserInput);
      
      const updateInput: UpdateUserInput = {
        id: created.id,
        full_name: 'Database Updated Name',
      };

      await updateUser(updateInput);

      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, created.id))
        .execute();

      expect(dbUser[0].full_name).toEqual('Database Updated Name');
    });
  });

  describe('deleteUser', () => {
    it('should return false when user not found', async () => {
      const result = await deleteUser(999);
      expect(result).toEqual(false);
    });

    it('should soft delete user (set is_active to false)', async () => {
      const created = await createUser(testUserInput);
      const result = await deleteUser(created.id);

      expect(result).toEqual(true);

      // Check that user still exists but is inactive
      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, created.id))
        .execute();

      expect(dbUser).toHaveLength(1);
      expect(dbUser[0].is_active).toEqual(false);
      expect(dbUser[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('updateUserLastLogin', () => {
    it('should update last login timestamp', async () => {
      const created = await createUser(testUserInput);
      
      expect(created.last_login).toBeNull();

      await updateUserLastLogin(created.id);

      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, created.id))
        .execute();

      expect(dbUser[0].last_login).toBeInstanceOf(Date);
      expect(dbUser[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('validateUserCredentials', () => {
    it('should return null for non-existent user', async () => {
      const result = await validateUserCredentials('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should return null for wrong password', async () => {
      await createUser(testUserInput);
      const result = await validateUserCredentials('testuser', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const created = await createUser(testUserInput);
      // Deactivate user
      await deleteUser(created.id);
      
      const result = await validateUserCredentials('testuser', 'testpassword123');
      expect(result).toBeNull();
    });

    it('should return user for valid credentials', async () => {
      await createUser(testUserInput);
      const result = await validateUserCredentials('testuser', 'testpassword123');

      expect(result).not.toBeNull();
      expect(result?.username).toEqual('testuser');
      expect(result?.email).toEqual('test@example.com');
      expect(result?.is_active).toEqual(true);
    });
  });
});