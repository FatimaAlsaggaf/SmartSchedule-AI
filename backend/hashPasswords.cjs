const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Simple standalone connection - no config dependencies
const connectDB = async () => {
  try {
    // Use your exact database name from the server logs
const mongoUri = process.env.MONGO_URI;    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('📍 Database name:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Make sure MongoDB is running and the database name is correct');
    process.exit(1);
  }
};

// Simple user schema for migration (matches your User collection)
const UserMigrationSchema = new mongoose.Schema({
  userID: Number,
  First_Name: String,
  Last_Name: String,
  Email: String,
  Password: String,
  role: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { 
  collection: 'User',  // This should match your exact collection name
  timestamps: true 
});

const UserMigration = mongoose.model('UserMigration', UserMigrationSchema);

const hashExistingPasswords = async () => {
  try {
    console.log('🔍 Finding users with plain text passwords...');
    
    // First, let's see what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    const users = await UserMigration.find({});
    console.log(`📊 Found ${users.length} users in 'User' collection`);

    if (users.length === 0) {
      console.log('📝 No users found. Possible reasons:');
      console.log('   - Collection name might be different');
      console.log('   - Database name might be different');
      console.log('   - No users exist yet');
      return;
    }

    let hashedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        if (!user.Password) {
          console.log(`⚠️  Skipping ${user.Email} - no password field`);
          skippedCount++;
          continue;
        }

        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (user.Password.startsWith('$2b$')) {
          console.log(`⏭️  Skipping ${user.Email} - already hashed`);
          skippedCount++;
          continue;
        }

        console.log(`🔨 Hashing password for ${user.Email}...`);
        
        // Hash the plain text password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(user.Password, saltRounds);
        
        // Update the user with hashed password
        await UserMigration.updateOne(
          { _id: user._id },
          { Password: hashedPassword }
        );

        console.log(`✅ Successfully hashed password for ${user.Email}`);
        hashedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to hash password for ${user.Email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Hashed: ${hashedCount} passwords`);
    console.log(`⏭️  Skipped: ${skippedCount} (already hashed or no password)`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${users.length} users processed`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Main function
const runMigration = async () => {
  console.log('🚀 Starting password hashing migration...');
  console.log('📁 Working directory:', process.cwd());
  
  try {
    await connectDB();
    await hashExistingPasswords();
  } catch (error) {
    console.error('💥 Migration crashed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
};

// Run it
runMigration().catch(console.error);