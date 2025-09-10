import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type User, 
  type CreateUserInput, 
  type UpdateUserInput 
} from '../schema';

export async function getUsers(): Promise<User[]> {
  try {
    const results = await db.select()
      .from(usersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Getting users failed:', error);
    throw error;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Getting user by id failed:', error);
    throw error;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Getting user by username failed:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .execute();

    return results[0] || null;
  } catch (error) {
    console.error('Getting user by email failed:', error);
    throw error;
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Hash password - in a real app, use bcrypt or similar
    const password_hash = `hashed_${input.password}`;

    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash,
        full_name: input.full_name,
        role: input.role,
        is_active: input.is_active,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

export async function updateUser(input: UpdateUserInput): Promise<User | null> {
  try {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (input.username !== undefined) updateData.username = input.username;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.password !== undefined) updateData.password_hash = `hashed_${input.password}`;
    if (input.full_name !== undefined) updateData.full_name = input.full_name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    // Soft delete by setting is_active to false
    const result = await db.update(usersTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
}

export async function updateUserLastLogin(id: number): Promise<void> {
  try {
    await db.update(usersTable)
      .set({ 
        last_login: new Date(),
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .execute();
  } catch (error) {
    console.error('Update user last login failed:', error);
    throw error;
  }
}

export async function validateUserCredentials(username: string, password: string): Promise<User | null> {
  try {
    // In a real app, this would hash the password and compare with stored hash
    const hashedPassword = `hashed_${password}`;
    
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .execute();

    const user = results[0];
    
    if (!user || user.password_hash !== hashedPassword || !user.is_active) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('User credential validation failed:', error);
    throw error;
  }
}