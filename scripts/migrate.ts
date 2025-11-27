/**
 * FoodRescue Database Migration Script
 * 
 * This script initializes the database schema and optionally seeds test data.
 * 
 * Usage:
 *   npm run migrate                  # Run migrations and exit
 *   NODE_ENV=production npm run migrate  # Run in production mode
 */

import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const SALT_ROUNDS = 10;

// Initialize database connection
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = neon(databaseUrl);
const db = drizzle(client);

interface TestUser {
  fullName: string;
  email: string;
  password: string;
  role: "donor" | "ngo" | "volunteer" | "admin";
  profile: any;
}

async function migrateDatabase() {
  console.log("🚀 Starting FoodRescue Database Migration...\n");

  try {
    // Step 1: Create tables (idempotent - will skip if exist)
    console.log("📋 Creating/verifying database schema...");
    
    // Check if users table exists
    const tableExists = await db.execute(
      sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists;
      `
    );

    if (!tableExists[0]?.exists) {
      console.log("   ✅ Creating users table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('donor', 'ngo', 'volunteer', 'admin')),
          phone TEXT,
          is_verified BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          donor_profile JSONB,
          ngo_profile JSONB,
          volunteer_profile JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        );
      `);
    }

    if ((await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'donations') as exists;`))[0]?.exists === false) {
      console.log("   ✅ Creating donations table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS donations (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          donation_id TEXT NOT NULL UNIQUE,
          donor_id VARCHAR(36) NOT NULL REFERENCES users(id),
          food_details JSONB NOT NULL,
          location JSONB NOT NULL,
          urgency_score DECIMAL,
          urgency_category TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'accepted', 'in_transit', 'delivered', 'cancelled')),
          completion_percentage INTEGER DEFAULT 0,
          matched_ngo_id VARCHAR(36) REFERENCES users(id),
          assigned_volunteer_id VARCHAR(36) REFERENCES users(id),
          task_id VARCHAR(36),
          timeline JSONB,
          cancellation_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    if ((await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ratings') as exists;`))[0]?.exists === false) {
      console.log("   ✅ Creating ratings table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ratings (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          donation_id VARCHAR(36) NOT NULL UNIQUE REFERENCES donations(id),
          rated_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
          rated_user_id VARCHAR(36) NOT NULL REFERENCES users(id),
          rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
          feedback TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    if ((await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') as exists;`))[0]?.exists === false) {
      console.log("   ✅ Creating notifications table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id),
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          related_donation_id VARCHAR(36) REFERENCES donations(id),
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    if ((await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'volunteer_tasks') as exists;`))[0]?.exists === false) {
      console.log("   ✅ Creating volunteer_tasks table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS volunteer_tasks (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id TEXT NOT NULL UNIQUE,
          donation_id VARCHAR(36) NOT NULL REFERENCES donations(id),
          volunteer_id VARCHAR(36) REFERENCES users(id),
          status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
          pickup_location JSONB,
          delivery_location JSONB,
          pickup_time TIMESTAMP,
          delivery_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    console.log("✅ Schema verified successfully!\n");

    // Step 2: Check if we should seed test data
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users;`);
    const hasUsers = userCount[0]?.count > 0;

    if (!hasUsers) {
      console.log("📊 Database is empty. Seeding test data...\n");
      await seedTestData();
      console.log("✅ Test data seeded successfully!\n");
    } else {
      console.log("✅ Database already contains users. Skipping seed.\n");
    }

    console.log("🎉 Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start your app: npm run dev");
    console.log("   2. Test the application");
    console.log("   3. Deploy when ready\n");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

async function seedTestData() {
  const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

  const testUsers: TestUser[] = [
    {
      fullName: "Pizza Palace Restaurant",
      email: "pizzapalace@donor.com",
      password: hashedPassword,
      role: "donor",
      profile: {
        businessName: "Pizza Palace",
        businessType: "Restaurant",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          pincode: "10001",
          coordinates: [40.7128, -74.0060]
        },
        rating: 4.5,
        totalRatings: 2
      }
    },
    {
      fullName: "Fresh Market Bakery",
      email: "freshmarket@donor.com",
      password: hashedPassword,
      role: "donor",
      profile: {
        businessName: "Fresh Market Bakery",
        businessType: "Bakery",
        address: {
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          pincode: "90001",
          coordinates: [34.0522, -118.2437]
        },
        rating: 4.8,
        totalRatings: 1
      }
    },
    {
      fullName: "Organic Farm Stand",
      email: "organicfarm@donor.com",
      password: hashedPassword,
      role: "donor",
      profile: {
        businessName: "Organic Farm Stand",
        businessType: "Farm",
        address: {
          street: "789 Green Lane",
          city: "Portland",
          state: "OR",
          pincode: "97201",
          coordinates: [45.5152, -122.6784]
        }
      }
    },
    {
      fullName: "Community Help NGO",
      email: "communityhelp@ngo.com",
      password: hashedPassword,
      role: "ngo",
      profile: {
        organizationName: "Community Help",
        registrationNumber: "NGO-2024-001",
        address: {
          street: "321 Service Blvd",
          city: "Chicago",
          state: "IL",
          pincode: "60601",
          coordinates: [41.8781, -87.6298]
        },
        capacity: 100,
        acceptedCategories: ["Cooked Meals", "Bakery", "Vegetables"]
      }
    },
    {
      fullName: "Hope for All",
      email: "hopeforall@ngo.com",
      password: hashedPassword,
      role: "ngo",
      profile: {
        organizationName: "Hope for All",
        registrationNumber: "NGO-2024-002",
        address: {
          street: "555 Hope Street",
          city: "Houston",
          state: "TX",
          pincode: "77001",
          coordinates: [29.7604, -95.3698]
        },
        capacity: 150,
        acceptedCategories: ["Cooked Meals", "Packaged Food", "Fruits"]
      }
    },
    {
      fullName: "Volunteer Sam",
      email: "sam@volunteer.com",
      password: hashedPassword,
      role: "volunteer",
      profile: {
        vehicleType: "Motorcycle",
        availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        currentLocation: {
          coordinates: [40.7580, -73.9855]
        },
        completedTasks: 5
      }
    },
    {
      fullName: "Volunteer Maria",
      email: "maria@volunteer.com",
      password: hashedPassword,
      role: "volunteer",
      profile: {
        vehicleType: "Car",
        availability: ["Saturday", "Sunday"],
        currentLocation: {
          coordinates: [34.0522, -118.2437]
        },
        completedTasks: 8
      }
    },
    {
      fullName: "Admin User",
      email: "admin@foodrescue.com",
      password: hashedPassword,
      role: "admin",
      profile: {}
    }
  ];

  for (const user of testUsers) {
    try {
      const profile = 
        user.role === "donor" ? { donorProfile: user.profile } :
        user.role === "ngo" ? { ngoProfile: user.profile } :
        user.role === "volunteer" ? { volunteerProfile: user.profile } :
        {};

      await db.execute(sql`
        INSERT INTO users (full_name, email, password, role, ${
          user.role === "donor" ? sql`donor_profile` :
          user.role === "ngo" ? sql`ngo_profile` :
          user.role === "volunteer" ? sql`volunteer_profile` :
          sql`NULL`
        })
        VALUES (${user.fullName}, ${user.email}, ${user.password}, ${user.role}, ${user.role !== "admin" ? JSON.stringify(user.profile) : null})
      `);
      console.log(`   ✅ Created ${user.role}: ${user.fullName}`);
    } catch (error: any) {
      if (error.message?.includes("unique constraint")) {
        console.log(`   ⏭️  Skipped ${user.fullName} (already exists)`);
      } else {
        throw error;
      }
    }
  }
}

// Run migration
migrateDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
