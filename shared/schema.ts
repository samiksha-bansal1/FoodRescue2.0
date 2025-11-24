import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// User roles enum
export const userRoles = ["donor", "ngo", "volunteer", "admin"] as const;
export const donationStatuses = ["pending", "matched", "accepted", "in_transit", "delivered", "cancelled"] as const;
export const taskStatuses = ["assigned", "accepted", "picked_up", "in_transit", "delivered", "cancelled"] as const;
export const urgencyLevels = ["high", "medium", "low"] as const;
export const foodCategories = ["Cooked Meals", "Bakery", "Dairy", "Vegetables", "Fruits", "Packaged Food"] as const;

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<typeof userRoles[number]>(),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  
  // Role-specific profiles stored as JSON
  donorProfile: jsonb("donor_profile").$type<{
    businessName: string;
    businessType: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      coordinates: [number, number];
    };
    rating?: number;
    totalRatings?: number;
    ratingBreakdown?: {
      foodQuality: number;
      packaging: number;
      accuracy: number;
      communication: number;
    };
  }>(),
  
  ngoProfile: jsonb("ngo_profile").$type<{
    organizationName: string;
    registrationNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      coordinates: [number, number];
    };
    capacity: number;
    acceptedCategories: string[];
  }>(),
  
  volunteerProfile: jsonb("volunteer_profile").$type<{
    vehicleType: string;
    availability: string[];
    currentLocation: {
      coordinates: [number, number];
    };
    completedTasks: number;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Donations table
export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donationId: text("donation_id").notNull().unique(),
  donorId: varchar("donor_id").notNull(),
  
  foodDetails: jsonb("food_details").notNull().$type<{
    category: string;
    name: string;
    quantity: number;
    unit: string;
    preparationTime: string;
    expiryTime: string;
    dietaryInfo: string[];
    specialInstructions?: string;
    images: string[];
  }>(),
  
  location: jsonb("location").notNull().$type<{
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    coordinates: [number, number];
  }>(),
  
  urgencyScore: decimal("urgency_score"),
  urgencyCategory: text("urgency_category").$type<typeof urgencyLevels[number]>(),
  
  status: text("status").notNull().$type<typeof donationStatuses[number]>().default("pending"),
  completionPercentage: integer("completion_percentage").default(0),
  
  matchedNGOId: varchar("matched_ngo_id"),
  assignedVolunteerId: varchar("assigned_volunteer_id"),
  taskId: varchar("task_id"),
  
  timeline: jsonb("timeline").$type<Array<{
    status: string;
    timestamp: string;
    updatedBy?: string;
    note?: string;
  }>>(),
  
  cancellationReason: text("cancellation_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Volunteer tasks table
export const volunteerTasks = pgTable("volunteer_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: text("task_id").notNull().unique(),
  donationId: varchar("donation_id").notNull(),
  volunteerId: varchar("volunteer_id").notNull(),
  donorId: varchar("donor_id").notNull(),
  ngoId: varchar("ngo_id").notNull(),
  
  pickupLocation: jsonb("pickup_location").notNull().$type<{
    address: string;
    coordinates: [number, number];
  }>(),
  
  deliveryLocation: jsonb("delivery_location").notNull().$type<{
    address: string;
    coordinates: [number, number];
  }>(),
  
  distance: decimal("distance"),
  estimatedTime: integer("estimated_time"),
  
  status: text("status").notNull().$type<typeof taskStatuses[number]>().default("assigned"),
  
  pickupTime: timestamp("pickup_time"),
  deliveryTime: timestamp("delivery_time"),
  
  photos: jsonb("photos").$type<{
    pickupPhoto?: string;
    deliveryPhoto?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ratings table
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donationId: varchar("donation_id").notNull(),
  ratedBy: varchar("rated_by").notNull(),
  ratedTo: varchar("rated_to").notNull(),
  ratedType: text("rated_type").notNull().$type<"ngo" | "volunteer">(),
  
  rating: integer("rating").notNull(),
  comment: text("comment"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientId: varchar("recipient_id").notNull(),
  type: text("type").notNull(),
  
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  relatedDonationId: varchar("related_donation_id"),
  relatedUserId: varchar("related_user_id"),
  
  isRead: boolean("is_read").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  role: z.enum(userRoles),
  phone: z.string().optional(),
}).omit({ id: true, createdAt: true, lastLogin: true });

export const insertDonationSchema = createInsertSchema(donations, {
  status: z.enum(donationStatuses).optional(),
  urgencyCategory: z.enum(urgencyLevels).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTaskSchema = createInsertSchema(volunteerTasks, {
  status: z.enum(taskStatuses).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export type VolunteerTask = typeof volunteerTasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Register schema with role-specific validation
export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Invalid phone number"),
  role: z.enum(userRoles),
  donorProfile: z.object({
    businessName: z.string(),
    businessType: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      pincode: z.string(),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
  }).optional(),
  ngoProfile: z.object({
    organizationName: z.string(),
    registrationNumber: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      pincode: z.string(),
      coordinates: z.tuple([z.number(), z.number()]),
    }),
    capacity: z.number(),
    acceptedCategories: z.array(z.string()),
  }).optional(),
  volunteerProfile: z.object({
    vehicleType: z.string(),
    availability: z.array(z.string()),
    currentLocation: z.object({
      coordinates: z.tuple([z.number(), z.number()]),
    }),
    completedTasks: z.number().default(0),
  }).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
