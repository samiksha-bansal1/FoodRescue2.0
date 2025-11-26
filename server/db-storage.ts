import { db } from "./db";
import { users, donations, volunteerTasks, ratings, notifications } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";
import type { User, InsertUser, Donation, InsertDonation, VolunteerTask, InsertTask, Rating, InsertRating, Notification, InsertNotification } from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private seeded = false;

  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    if (this.seeded) return;
    
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        this.seeded = true;
        return;
      }

      const bcryptModule = await import('bcryptjs');
      const testPassword = await bcryptModule.default.hash('password123', 10);
      const adminPassword = await bcryptModule.default.hash('admin123', 10);

      // Seed donors
      const donorData = [
        {
          fullName: 'Pizza Palace Restaurant',
          email: 'donor1@foodrescue.test',
          phone: '555-0001',
          donorProfile: {
            businessName: 'Pizza Palace Restaurant',
            businessType: 'Restaurant',
            address: {
              street: '123 Main Street',
              city: 'New York',
              state: 'NY',
              pincode: '10001',
              coordinates: [40.7128, -74.0060] as [number, number],
            },
            rating: 4.5,
            totalRatings: 10,
          },
        },
        {
          fullName: 'Fresh Market Bakery',
          email: 'donor2@foodrescue.test',
          phone: '555-0002',
          donorProfile: {
            businessName: 'Fresh Market Bakery',
            businessType: 'Bakery',
            address: {
              street: '456 Park Ave',
              city: 'Brooklyn',
              state: 'NY',
              pincode: '11201',
              coordinates: [40.6782, -73.9442] as [number, number],
            },
            rating: 4.8,
            totalRatings: 15,
          },
        },
        {
          fullName: 'Organic Farm Stand',
          email: 'donor3@foodrescue.test',
          phone: '555-0003',
          donorProfile: {
            businessName: 'Organic Farm Stand',
            businessType: 'Farm',
            address: {
              street: '789 Queens Blvd',
              city: 'Queens',
              state: 'NY',
              pincode: '11375',
              coordinates: [40.7282, -73.7949] as [number, number],
            },
            rating: 4.2,
            totalRatings: 8,
          },
        },
      ];

      for (const donor of donorData) {
        await db.insert(users).values({
          id: randomUUID(),
          fullName: donor.fullName,
          email: donor.email,
          password: testPassword,
          role: 'donor',
          phone: donor.phone,
          isVerified: true,
          isActive: true,
          donorProfile: donor.donorProfile,
          ngoProfile: null,
          volunteerProfile: null,
        });
      }

      // Seed NGOs
      const ngoData = [
        {
          fullName: 'City Food Bank',
          email: 'ngo1@foodrescue.test',
          phone: '555-1001',
          ngoProfile: {
            organizationName: 'City Food Bank',
            registrationNumber: 'NGO-001',
            address: {
              street: '100 Charity Lane',
              city: 'New York',
              state: 'NY',
              pincode: '10002',
              coordinates: [40.7489, -73.9680] as [number, number],
            },
            capacity: 1000,
            acceptedCategories: ['Cooked Meals', 'Bakery', 'Vegetables', 'Fruits', 'Packaged Food'],
          },
        },
        {
          fullName: 'Community Outreach',
          email: 'ngo2@foodrescue.test',
          phone: '555-1002',
          ngoProfile: {
            organizationName: 'Community Outreach',
            registrationNumber: 'NGO-002',
            address: {
              street: '200 Mission St',
              city: 'Brooklyn',
              state: 'NY',
              pincode: '11202',
              coordinates: [40.6501, -73.9496] as [number, number],
            },
            capacity: 800,
            acceptedCategories: ['Cooked Meals', 'Packaged Food'],
          },
        },
        {
          fullName: 'Hope for All',
          email: 'ngo3@foodrescue.test',
          phone: '555-1003',
          ngoProfile: {
            organizationName: 'Hope for All',
            registrationNumber: 'NGO-003',
            address: {
              street: '300 Hope Blvd',
              city: 'Queens',
              state: 'NY',
              pincode: '11376',
              coordinates: [40.7282, -73.7949] as [number, number],
            },
            capacity: 600,
            acceptedCategories: ['Vegetables', 'Fruits', 'Bakery'],
          },
        },
      ];

      for (const ngo of ngoData) {
        await db.insert(users).values({
          id: randomUUID(),
          fullName: ngo.fullName,
          email: ngo.email,
          password: testPassword,
          role: 'ngo',
          phone: ngo.phone,
          isVerified: true,
          isActive: true,
          donorProfile: null,
          ngoProfile: ngo.ngoProfile,
          volunteerProfile: null,
        });
      }

      // Seed volunteers
      const volunteerData = [
        { fullName: 'John Driver', email: 'volunteer1@foodrescue.test', phone: '555-2001', vehicle: 'Motorcycle' },
        { fullName: 'Sarah Delivery', email: 'volunteer2@foodrescue.test', phone: '555-2002', vehicle: 'Car' },
        { fullName: 'Mike Express', email: 'volunteer3@foodrescue.test', phone: '555-2003', vehicle: 'Van' },
        { fullName: 'Emma Swift', email: 'volunteer4@foodrescue.test', phone: '555-2004', vehicle: 'Bicycle' },
      ];

      for (const vol of volunteerData) {
        await db.insert(users).values({
          id: randomUUID(),
          fullName: vol.fullName,
          email: vol.email,
          password: testPassword,
          role: 'volunteer',
          phone: vol.phone,
          isVerified: true,
          isActive: true,
          donorProfile: null,
          ngoProfile: null,
          volunteerProfile: {
            vehicleType: vol.vehicle,
            availability: ['Morning', 'Afternoon', 'Evening'],
            currentLocation: { coordinates: [40.7128, -74.0060] },
            completedTasks: 0,
          },
        });
      }

      // Seed admin
      await db.insert(users).values({
        id: randomUUID(),
        fullName: 'Admin User',
        email: 'admin@foodrescue.com',
        password: adminPassword,
        role: 'admin',
        phone: '555-9999',
        isVerified: true,
        isActive: true,
        donorProfile: null,
        ngoProfile: null,
        volunteerProfile: null,
      });

      // Seed sample donations to demonstrate workflow
      const allUsers = await this.getAllUsers();
      const donor = allUsers.find(u => u.role === 'donor' && u.email === 'donor1@foodrescue.test');
      const ngo = allUsers.find(u => u.role === 'ngo' && u.email === 'ngo1@foodrescue.test');

      if (donor && ngo) {
        // Pending donation
        await db.insert(donations).values({
          id: randomUUID(),
          donorId: donor.id,
          matchedNGOId: null,
          assignedVolunteerId: null,
          foodDetails: {
            name: 'Fresh Pasta & Sauce',
            category: 'Cooked Meals',
            quantity: 10,
            unit: 'kg',
            dietaryInfo: ['Vegetarian'],
            specialInstructions: 'Keep refrigerated',
            preparationTime: new Date(Date.now() - 30 * 60000).toISOString(),
            expiryTime: new Date(Date.now() + 2 * 60 * 60000).toISOString(),
            images: [],
          },
          location: {
            address: { street: '123 Main Street', city: 'New York', state: 'NY', pincode: '10001' },
            coordinates: [40.7128, -74.0060],
          },
          status: 'pending',
          completionPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Accepted (50%) - NGO accepted, waiting for ride
        await db.insert(donations).values({
          id: randomUUID(),
          donorId: donor.id,
          matchedNGOId: ngo.id,
          assignedVolunteerId: null,
          foodDetails: {
            name: 'Bakery Items',
            category: 'Bakery',
            quantity: 5,
            unit: 'kg',
            dietaryInfo: ['Contains Nuts'],
            specialInstructions: 'Handle with care',
            preparationTime: new Date(Date.now() - 60 * 60000).toISOString(),
            expiryTime: new Date(Date.now() + 1 * 60 * 60000).toISOString(),
            images: [],
          },
          location: {
            address: { street: '123 Main Street', city: 'New York', state: 'NY', pincode: '10001' },
            coordinates: [40.7128, -74.0060],
          },
          status: 'matched',
          completionPercentage: 50,
          createdAt: new Date(Date.now() - 5 * 60000),
          updatedAt: new Date(Date.now() - 5 * 60000),
        });
      }

      this.seeded = true;
    } catch (error) {
      console.error('Failed to seed database:', error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const result = await db.insert(users).values({ ...user, id } as any).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getPendingUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isVerified, false));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  // Donations
  async getDonation(id: string): Promise<Donation | undefined> {
    const result = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
    return result[0];
  }

  async getAllDonations(): Promise<Donation[]> {
    return db.select().from(donations);
  }

  async getDonationsByDonor(donorId: string): Promise<Donation[]> {
    return db.select().from(donations).where(eq(donations.donorId, donorId));
  }

  async getAvailableDonations(): Promise<Donation[]> {
    return db.select().from(donations).where(eq(donations.status, 'pending'));
  }

  async getDonationsByNGO(ngoId: string): Promise<Donation[]> {
    return db.select().from(donations).where(eq(donations.matchedNGOId, ngoId));
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const id = randomUUID();
    const result = await db.insert(donations).values({
      ...donation,
      id,
      donationId: id,
      completionPercentage: 0,
    } as any).returning();
    return result[0];
  }

  async updateDonation(id: string, updates: Partial<Donation>): Promise<Donation | undefined> {
    let finalUpdates = { ...updates };
    
    // Auto-calculate completion percentage based on status
    if (updates.status) {
      const statusMap: Record<string, number> = {
        'pending': 0,
        'matched': 50,
        'accepted': 75,
        'picked_up': 80,
        'in_transit': 90,
        'delivered': 100,
        'cancelled': 0,
      };
      finalUpdates.completionPercentage = statusMap[updates.status] || 0;
    }

    const result = await db.update(donations).set(finalUpdates).where(eq(donations.id, id)).returning();
    return result[0];
  }

  // Volunteer Tasks
  async getTask(id: string): Promise<VolunteerTask | undefined> {
    const result = await db.select().from(volunteerTasks).where(eq(volunteerTasks.id, id)).limit(1);
    return result[0];
  }

  async getAllTasks(): Promise<VolunteerTask[]> {
    return db.select().from(volunteerTasks);
  }

  async getTasksByVolunteer(volunteerId: string): Promise<VolunteerTask[]> {
    return db.select().from(volunteerTasks).where(eq(volunteerTasks.volunteerId, volunteerId));
  }

  async getAvailableTasks(): Promise<VolunteerTask[]> {
    return db.select().from(volunteerTasks).where(eq(volunteerTasks.status, 'assigned'));
  }

  async createTask(task: InsertTask): Promise<VolunteerTask> {
    const id = randomUUID();
    const result = await db.insert(volunteerTasks).values({
      ...task,
      id,
      taskId: id,
    } as any).returning();
    return result[0];
  }

  async updateTask(id: string, updates: Partial<VolunteerTask>): Promise<VolunteerTask | undefined> {
    const result = await db.update(volunteerTasks).set(updates).where(eq(volunteerTasks.id, id)).returning();
    return result[0];
  }

  // Ratings
  async createRating(rating: InsertRating): Promise<Rating> {
    const result = await db.insert(ratings).values(rating as any).returning();
    return result[0];
  }

  async getRatingsByDonation(donationId: string): Promise<Rating[]> {
    return db.select().from(ratings).where(eq(ratings.donationId, donationId));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification as any).returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.recipientId, userId));
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return !!result[0];
  }
}

export const dbStorage = new DatabaseStorage();
