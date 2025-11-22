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
    
    // Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      fullName: 'Admin User',
      email: 'admin@foodrescue.com',
      password: adminPassword,
      role: 'admin',
      phone: '1234567890',
      isVerified: true,
      isActive: true,
      donorProfile: null,
      ngoProfile: null,
      volunteerProfile: null,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(adminId, admin);

    // Donor User (Restaurant)
    const donorPassword = await bcrypt.hash('password123', 10);
    const donorId = randomUUID();
    const donor: User = {
      id: donorId,
      fullName: 'Pizza Palace',
      email: 'donor@foodrescue.com',
      password: donorPassword,
      role: 'donor',
      phone: '9876543210',
      isVerified: true,
      isActive: true,
      donorProfile: {
        businessName: 'Pizza Palace Restaurant',
        businessType: 'Restaurant',
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          pincode: '10001',
          coordinates: [40.7128, -74.0060],
        },
      },
      ngoProfile: null,
      volunteerProfile: null,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(donorId, donor);

    // NGO User
    const ngoPassword = await bcrypt.hash('password123', 10);
    const ngoId = randomUUID();
    const ngo: User = {
      id: ngoId,
      fullName: 'Hope Foundation',
      email: 'ngo@foodrescue.com',
      password: ngoPassword,
      role: 'ngo',
      phone: '9123456789',
      isVerified: true,
      isActive: true,
      donorProfile: null,
      ngoProfile: {
        organizationName: 'Hope Foundation',
        registrationNumber: 'NGO-2024-001',
        address: {
          street: '456 Charity Avenue',
          city: 'New York',
          state: 'NY',
          pincode: '10002',
          coordinates: [40.7150, -73.9960],
        },
        capacity: 500,
        acceptedCategories: ['Cooked Meals', 'Bakery', 'Vegetables', 'Fruits'],
      },
      volunteerProfile: null,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(ngoId, ngo);

    // Volunteer User
    const volunteerPassword = await bcrypt.hash('password123', 10);
    const volunteerId = randomUUID();
    const volunteer: User = {
      id: volunteerId,
      fullName: 'John Delivery',
      email: 'volunteer@foodrescue.com',
      password: volunteerPassword,
      role: 'volunteer',
      phone: '8765432109',
      isVerified: true,
      isActive: true,
      donorProfile: null,
      ngoProfile: null,
      volunteerProfile: {
        vehicleType: 'Motorcycle',
        availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        currentLocation: {
          coordinates: [40.7140, -74.0050],
        },
        completedTasks: 0,
      },
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(volunteerId, volunteer);
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

  async getAvailableDonations(): Promise<Donation[]> {
    return Array.from(this.donations.values()).filter(d => d.status === 'pending');
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
