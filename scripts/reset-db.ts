/**
 * FoodRescue Database Reset Script
 * 
 * ⚠️  WARNING: This script DELETES all data and recreates the database!
 * 
 * Usage:
 *   npm run db:reset     # Full database reset
 * 
 * This is useful for:
 *   - Cleaning up test data
 *   - Starting fresh during development
 *   - Resetting to initial state
 */

import { db } from "@server/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

async function resetDatabase() {
  console.log("⚠️  WARNING: This will DELETE ALL DATA and reset the database!\n");

  // Prompt for confirmation
  const args = process.argv.slice(2);
  const confirmed = args.includes("--confirm");

  if (!confirmed) {
    console.log("To confirm the reset, run with --confirm flag:");
    console.log("npm run db:reset -- --confirm\n");
    process.exit(0);
  }

  try {
    console.log("🗑️  Dropping all tables...\n");

    // Drop tables in order (respecting foreign keys)
    await db.execute(sql`DROP TABLE IF EXISTS volunteer_tasks CASCADE;`);
    console.log("   ✅ Dropped volunteer_tasks");

    await db.execute(sql`DROP TABLE IF EXISTS ratings CASCADE;`);
    console.log("   ✅ Dropped ratings");

    await db.execute(sql`DROP TABLE IF EXISTS notifications CASCADE;`);
    console.log("   ✅ Dropped notifications");

    await db.execute(sql`DROP TABLE IF EXISTS donations CASCADE;`);
    console.log("   ✅ Dropped donations");

    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
    console.log("   ✅ Dropped users\n");

    console.log("🔄 Recreating schema...\n");

    // Recreate all tables
    await db.execute(sql`
      CREATE TABLE users (
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
    console.log("   ✅ Created users table");

    await db.execute(sql`
      CREATE TABLE donations (
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
    console.log("   ✅ Created donations table");

    await db.execute(sql`
      CREATE TABLE ratings (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        donation_id VARCHAR(36) NOT NULL UNIQUE REFERENCES donations(id),
        rated_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
        rated_user_id VARCHAR(36) NOT NULL REFERENCES users(id),
        rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("   ✅ Created ratings table");

    await db.execute(sql`
      CREATE TABLE notifications (
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
    console.log("   ✅ Created notifications table");

    await db.execute(sql`
      CREATE TABLE volunteer_tasks (
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
    console.log("   ✅ Created volunteer_tasks table\n");

    console.log("📊 Seeding fresh test data...\n");

    const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

    const testUsers = [
      {
        name: "Pizza Palace Restaurant",
        email: "pizzapalace@donor.com",
        role: "donor",
        profile: {
          businessName: "Pizza Palace",
          businessType: "Restaurant",
          address: { street: "123 Main St", city: "New York", state: "NY", pincode: "10001", coordinates: [40.7128, -74.0060] }
        }
      },
      {
        name: "Community Help NGO",
        email: "communityhelp@ngo.com",
        role: "ngo",
        profile: {
          organizationName: "Community Help",
          registrationNumber: "NGO-2024-001",
          address: { street: "321 Service Blvd", city: "Chicago", state: "IL", pincode: "60601", coordinates: [41.8781, -87.6298] },
          capacity: 100,
          acceptedCategories: ["Cooked Meals", "Bakery"]
        }
      }
    ];

    for (const user of testUsers) {
      const profileColumn = user.role === "donor" ? "donor_profile" : "ngo_profile";
      const profileValue = JSON.stringify(user.profile);
      
      await db.execute(
        sql`INSERT INTO users (full_name, email, password, role, ${sql.raw(profileColumn)}) VALUES (${user.name}, ${user.email}, ${hashedPassword}, ${user.role}, ${profileValue})`
      );
      console.log(`   ✅ Created ${user.role}: ${user.name}`);
    }

    console.log("\n🎉 Database reset completed successfully!");
    console.log("✅ Fresh database is ready to use\n");

  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

resetDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
