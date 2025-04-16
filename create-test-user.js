const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'test@example.com',
      },
    });

    if (existingUser) {
      console.log('Test user already exists with email: test@example.com');
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const updatedUser = await prisma.user.update({
        where: {
          email: 'test@example.com',
        },
        data: {
          password: hashedPassword,
        },
      });
      
      console.log('Updated user password');
      console.log(`User ID: ${updatedUser.id}`);
      console.log(`User email: ${updatedUser.email}`);
      console.log(`User username: ${updatedUser.username}`);
      
      return;
    }

    // Create new user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
      },
    });

    console.log('Created new test user:');
    console.log(`User ID: ${newUser.id}`);
    console.log(`User email: ${newUser.email}`);
    console.log(`User username: ${newUser.username}`);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 