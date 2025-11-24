import {
  type User,
  type InsertUser,
  type Donation,
  type InsertDonation,
  type VolunteerTask,
  type InsertTask,
  type Rating,
  type InsertRating,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Donations
  getDonation(id: string): Promise<Donation | undefined>;
  getAllDonations(): Promise<Donation[]>;
  getDonationsByDonor(donorId: string): Promise<Donation[]>;
  getAvailableDonations(): Promise<Donation[]>;
  getDonationsByNGO(ngoId: string): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: string, donation: Partial<Donation>): Promise<Donation | undefined>;

  // Volunteer Tasks
  getTask(id: string): Promise<VolunteerTask | undefined>;
  getAllTasks(): Promise<VolunteerTask[]>;
  getTasksByVolunteer(volunteerId: string): Promise<VolunteerTask[]>;
  getAvailableTasks(): Promise<VolunteerTask[]>;
  createTask(task: InsertTask): Promise<VolunteerTask>;
  updateTask(id: string, task: Partial<VolunteerTask>): Promise<VolunteerTask | undefined>;

  // Ratings
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByDonation(donationId: string): Promise<Rating[]>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private donations: Map<string, Donation>;
  private tasks: Map<string, VolunteerTask>;
  private ratings: Map<string, Rating>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.donations = new Map();
    this.tasks = new Map();
    this.ratings = new Map();
    this.notifications = new Map();
    
    // Create default users
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    const bcrypt = await import('bcryptjs');
    const testPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // ===== DONORS =====
    const donors = [
      {
        email: 'donor1@foodrescue.test',
        fullName: 'Pizza Palace Restaurant',
        phone: '555-0001',
        businessName: 'Pizza Palace Restaurant',
        businessType: 'Restaurant',
        city: 'New York',
        coordinates: [40.7128, -74.0060] as [number, number],
      },
      {
        email: 'donor2@foodrescue.test',
        fullName: 'Fresh Market Bakery',
        phone: '555-0002',
        businessName: 'Fresh Market Bakery',
        businessType: 'Bakery',
        city: 'Brooklyn',
        coordinates: [40.6782, -73.9442] as [number, number],
      },
      {
        email: 'donor3@foodrescue.test',
        fullName: 'Organic Farm Stand',
        phone: '555-0003',
        businessName: 'Organic Farm Stand',
        businessType: 'Farm',
        city: 'Queens',
        coordinates: [40.7282, -73.7949] as [number, number],
      },
    ];

    const donorUsers = donors.map(d => {
      const id = randomUUID();
      const user: User = {
        id,
        fullName: d.fullName,
        email: d.email,
        password: testPassword,
        role: 'donor',
        phone: d.phone,
        isVerified: true,
        isActive: true,
        donorProfile: {
          businessName: d.businessName,
          businessType: d.businessType,
          address: {
            street: `${Math.floor(Math.random() * 900) + 100} Main Street`,
            city: d.city,
            state: 'NY',
            pincode: `1000${Math.floor(Math.random() * 10)}`,
            coordinates: d.coordinates,
          },
          rating: Math.random() * 2 + 3.5,
          totalRatings: Math.floor(Math.random() * 20) + 5,
          ratingBreakdown: {
            foodQuality: Math.random() * 2 + 3,
            packaging: Math.random() * 2 + 3,
            accuracy: Math.random() * 2 + 3,
            communication: Math.random() * 2 + 3,
          },
        },
        ngoProfile: null,
        volunteerProfile: null,
        createdAt: new Date(),
        lastLogin: null,
      };
      this.users.set(id, user);
      return { ...user, id };
    });

    // ===== NGOs =====
    const ngos = [
      {
        email: 'ngo1@foodrescue.test',
        fullName: 'City Food Bank',
        phone: '555-1001',
        orgName: 'City Food Bank',
        city: 'New York',
        coordinates: [40.7489, -73.9680] as [number, number],
      },
      {
        email: 'ngo2@foodrescue.test',
        fullName: 'Community Outreach',
        phone: '555-1002',
        orgName: 'Community Outreach',
        city: 'Brooklyn',
        coordinates: [40.6501, -73.9496] as [number, number],
      },
      {
        email: 'ngo3@foodrescue.test',
        fullName: 'Hope for All',
        phone: '555-1003',
        orgName: 'Hope for All',
        city: 'Queens',
        coordinates: [40.7282, -73.7949] as [number, number],
      },
    ];

    const ngoUsers = ngos.map(n => {
      const id = randomUUID();
      const user: User = {
        id,
        fullName: n.fullName,
        email: n.email,
        password: testPassword,
        role: 'ngo',
        phone: n.phone,
        isVerified: true,
        isActive: true,
        donorProfile: null,
        ngoProfile: {
          organizationName: n.orgName,
          registrationNumber: `NGO-${Math.random().toString(36).substring(7).toUpperCase()}`,
          address: {
            street: `${Math.floor(Math.random() * 900) + 100} Charity Lane`,
            city: n.city,
            state: 'NY',
            pincode: `1000${Math.floor(Math.random() * 10)}`,
            coordinates: n.coordinates,
          },
          capacity: Math.floor(Math.random() * 1000) + 500,
          acceptedCategories: ['Cooked Meals', 'Bakery', 'Vegetables', 'Fruits', 'Packaged Food'],
        },
        volunteerProfile: null,
        createdAt: new Date(),
        lastLogin: null,
      };
      this.users.set(id, user);
      return { ...user, id };
    });

    // ===== VOLUNTEERS =====
    const volunteers = [
      {
        email: 'volunteer1@foodrescue.test',
        fullName: 'John Driver',
        phone: '555-2001',
        vehicle: 'Motorcycle',
      },
      {
        email: 'volunteer2@foodrescue.test',
        fullName: 'Sarah Delivery',
        phone: '555-2002',
        vehicle: 'Car',
      },
      {
        email: 'volunteer3@foodrescue.test',
        fullName: 'Mike Express',
        phone: '555-2003',
        vehicle: 'Van',
      },
      {
        email: 'volunteer4@foodrescue.test',
        fullName: 'Emma Swift',
        phone: '555-2004',
        vehicle: 'Bicycle',
      },
    ];

    const volunteerUsers = volunteers.map(v => {
      const id = randomUUID();
      const user: User = {
        id,
        fullName: v.fullName,
        email: v.email,
        password: testPassword,
        role: 'volunteer',
        phone: v.phone,
        isVerified: true,
        isActive: true,
        donorProfile: null,
        ngoProfile: null,
        volunteerProfile: {
          vehicleType: v.vehicle,
          availability: ['Morning', 'Afternoon', 'Evening'],
          currentLocation: { coordinates: [40.7128 + Math.random() * 0.1, -74.0060 + Math.random() * 0.1] },
          completedTasks: Math.floor(Math.random() * 30),
        },
        createdAt: new Date(),
        lastLogin: null,
      };
      this.users.set(id, user);
      return { ...user, id };
    });

    // ===== ADMIN =====
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
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
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(adminId, admin);

    // ===== SAMPLE DONATIONS =====
    const expiryHours = [2, 4, 8, 12, 24];
    for (let i = 0; i < 5; i++) {
      const donor = donorUsers[i % donorUsers.length];
      const expiryTime = new Date(Date.now() + expiryHours[i] * 3600000).toISOString();
      const id = randomUUID();
      const donationId = `DN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`;

      const donation: Donation = {
        id,
        donationId,
        donorId: donor.id,
        foodDetails: {
          category: ['Cooked Meals', 'Bakery', 'Vegetables', 'Fruits', 'Packaged Food'][i],
          name: ['Pizza', 'Bread', 'Vegetables Mix', 'Fresh Apples', 'Canned Goods'][i],
          quantity: Math.floor(Math.random() * 20) + 5,
          unit: 'kg',
          preparationTime: new Date().toISOString(),
          expiryTime,
          dietaryInfo: [],
          specialInstructions: 'Handle with care',
          images: [],
        },
        location: {
          address: {
            street: donor.donorProfile?.address.street || '123 Main',
            city: donor.donorProfile?.address.city || 'NY',
            state: 'NY',
            pincode: donor.donorProfile?.address.pincode || '10001',
          },
          coordinates: donor.donorProfile?.address.coordinates || [40.7128, -74.0060],
        },
        urgencyScore: null,
        urgencyCategory: expiryHours[i] < 4 ? 'high' : expiryHours[i] < 12 ? 'medium' : 'low',
        status: 'pending',
        matchedNGOId: null,
        assignedVolunteerId: null,
        timeline: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Donation created',
        }],
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.donations.set(id, donation);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => !user.isVerified);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Donations
  async getDonation(id: string): Promise<Donation | undefined> {
    return this.donations.get(id);
  }

  async getAllDonations(): Promise<Donation[]> {
    return Array.from(this.donations.values());
  }

  async getDonationsByDonor(donorId: string): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(d => d.donorId === donorId);
  }

  async getAvailableDonations(): Promise<any[]> {
    const availableDonations = Array.from(this.donations.values()).filter(d => d.status === 'pending');
    
    // Attach donor info to each donation
    return availableDonations.map(donation => {
      const donor = this.users.get(donation.donorId);
      return {
        ...donation,
        donor: donor ? {
          id: donor.id,
          fullName: donor.fullName,
          email: donor.email,
          phone: donor.phone,
          donorProfile: donor.donorProfile,
        } : null,
      };
    });
  }

  async getDonationsByNGO(ngoId: string): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(d => d.matchedNGOId === ngoId);
  }

  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const id = randomUUID();
    const donationId = `DN-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(this.donations.size + 1).padStart(4, '0')}`;
    
    const donation: Donation = {
      ...insertDonation,
      id,
      donationId,
      status: 'pending',
      urgencyScore: null,
      urgencyCategory: this.calculateUrgency(insertDonation.foodDetails.expiryTime),
      matchedNGOId: null,
      assignedVolunteerId: null,
      timeline: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Donation created',
      }],
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.donations.set(id, donation);
    return donation;
  }

  private calculateUrgency(expiryTime: string): 'high' | 'medium' | 'low' {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry < 4) return 'high';
    if (hoursUntilExpiry < 12) return 'medium';
    return 'low';
  }

  async updateDonation(id: string, updates: Partial<Donation>): Promise<Donation | undefined> {
    const donation = this.donations.get(id);
    if (!donation) return undefined;
    
    const updatedDonation = {
      ...donation,
      ...updates,
      updatedAt: new Date(),
    };
    
    if (updates.status && updates.status !== donation.status) {
      updatedDonation.timeline = [
        ...(donation.timeline || []),
        {
          status: updates.status,
          timestamp: new Date().toISOString(),
          note: `Status changed to ${updates.status}`,
        },
      ];
    }
    
    this.donations.set(id, updatedDonation);
    return updatedDonation;
  }

  // Volunteer Tasks
  async getTask(id: string): Promise<VolunteerTask | undefined> {
    return this.tasks.get(id);
  }

  async getAllTasks(): Promise<VolunteerTask[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByVolunteer(volunteerId: string): Promise<VolunteerTask[]> {
    return Array.from(this.tasks.values()).filter(t => t.volunteerId === volunteerId);
  }

  async getAvailableTasks(): Promise<VolunteerTask[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === 'assigned');
  }

  async createTask(insertTask: InsertTask): Promise<VolunteerTask> {
    const id = randomUUID();
    const taskId = `TK-${String(this.tasks.size + 1).padStart(6, '0')}`;
    
    const task: VolunteerTask = {
      ...insertTask,
      id,
      taskId,
      status: 'assigned',
      pickupTime: null,
      deliveryTime: null,
      photos: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<VolunteerTask>): Promise<VolunteerTask | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Ratings
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const rating: Rating = {
      ...insertRating,
      id,
      createdAt: new Date(),
    };
    this.ratings.set(id, rating);
    return rating;
  }

  async getRatingsByDonation(donationId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(r => r.donationId === donationId);
  }

  // Notifications
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    this.notifications.set(id, { ...notification, isRead: true });
    return true;
  }
}

export const storage = new MemStorage();
