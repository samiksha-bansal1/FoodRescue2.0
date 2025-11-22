import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";

const JWT_SECRET = process.env.JWT_SECRET || "foodrescue-secret-key-change-in-production";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { fullName, email, password, phone, role, donorProfile, ngoProfile, volunteerProfile } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        fullName,
        email,
        password: hashedPassword,
        phone,
        role,
        donorProfile: donorProfile || null,
        ngoProfile: ngoProfile || null,
        volunteerProfile: volunteerProfile || null,
      });

      const userResponse = { ...user };
      delete (userResponse as any).password;

      res.status(201).json({
        message: 'Registration successful. Your account is pending verification.',
        user: userResponse,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await storage.updateUser(user.id, { lastLogin: new Date() });

      const userResponse = { ...user };
      delete (userResponse as any).password;

      res.json({ user: userResponse, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Donation Routes
  app.get("/api/donations", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      let donations;

      if (user.role === 'donor') {
        donations = await storage.getDonationsByDonor(user.id);
      } else if (user.role === 'ngo') {
        donations = await storage.getDonationsByNGO(user.id);
      } else if (user.role === 'admin') {
        donations = await storage.getAllDonations();
      } else {
        donations = [];
      }

      res.json(donations);
    } catch (error) {
      console.error('Get donations error:', error);
      res.status(500).json({ error: 'Failed to fetch donations' });
    }
  });

  app.get("/api/donations/available", authenticateToken, async (req, res) => {
    try {
      const donations = await storage.getAvailableDonations();
      res.json(donations);
    } catch (error) {
      console.error('Get available donations error:', error);
      res.status(500).json({ error: 'Failed to fetch available donations' });
    }
  });

  app.post("/api/donations", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'donor') {
        return res.status(403).json({ error: 'Only donors can create donations' });
      }

      const donation = await storage.createDonation({
        ...req.body,
        donorId: user.id,
      });
      
      // Notify all NGOs about new donation
      const allUsers = await storage.getAllUsers();
      const ngos = allUsers.filter(u => u.role === 'ngo' && u.isVerified);
      
      for (const ngo of ngos) {
        await storage.createNotification({
          recipientId: ngo.id,
          type: 'new_donation',
          title: 'New Donation Available',
          message: `A new ${donation.foodDetails.category} donation is available in your area`,
          relatedDonationId: donation.id,
          relatedUserId: null,
        });
      }

      res.status(201).json(donation);
    } catch (error) {
      console.error('Create donation error:', error);
      res.status(500).json({ error: 'Failed to create donation' });
    }
  });

  app.post("/api/donations/:id/accept", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (user.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can accept donations' });
      }

      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (donation.status !== 'pending') {
        return res.status(400).json({ error: 'Donation is no longer available' });
      }

      const updatedDonation = await storage.updateDonation(id, {
        status: 'accepted',
        matchedNGOId: user.id,
      });

      // Create notification for donor
      await storage.createNotification({
        recipientId: donation.donorId,
        type: 'donation_accepted',
        title: 'Donation Accepted',
        message: 'Your donation has been accepted by an NGO',
        relatedDonationId: donation.id,
        relatedUserId: user.id,
      });

      // Find available volunteer and create task
      const allUsers = await storage.getAllUsers();
      const volunteers = allUsers.filter(u => u.role === 'volunteer' && u.isVerified);
      
      if (volunteers.length > 0) {
        const volunteer = volunteers[0]; // Simple assignment to first available volunteer
        
        const task = await storage.createTask({
          donationId: donation.id,
          volunteerId: volunteer.id,
          donorId: donation.donorId,
          ngoId: user.id,
          pickupLocation: {
            address: `${donation.location.address.street}, ${donation.location.address.city}`,
            coordinates: donation.location.coordinates,
          },
          deliveryLocation: {
            address: 'NGO Address', // Would come from NGO profile
            coordinates: [0, 0],
          },
          distance: '5.2',
          estimatedTime: 30,
        });

        await storage.updateDonation(id, {
          assignedVolunteerId: volunteer.id,
          status: 'matched',
        });

        // Notify volunteer
        await storage.createNotification({
          recipientId: volunteer.id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: 'You have been assigned a new delivery task',
          relatedDonationId: donation.id,
          relatedUserId: null,
        });

        // Emit Socket.IO event to notify volunteer in real-time
        const io = (app as any).io;
        if (io) {
          io.to(`user_${volunteer.id}`).emit('task_assigned', {
            taskId: task.id,
            donationId: donation.id,
            message: 'New delivery task assigned to you',
          });
        }
      }

      res.json(updatedDonation);
    } catch (error) {
      console.error('Accept donation error:', error);
      res.status(500).json({ error: 'Failed to accept donation' });
    }
  });

  // Task Routes
  app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      let tasks;

      if (user.role === 'volunteer') {
        tasks = await storage.getTasksByVolunteer(user.id);
      } else if (user.role === 'admin') {
        tasks = await storage.getAllTasks();
      } else {
        tasks = [];
      }

      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post("/api/tasks/:id/accept", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (user.role !== 'volunteer') {
        return res.status(403).json({ error: 'Only volunteers can accept tasks' });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const updatedTask = await storage.updateTask(id, {
        status: 'accepted',
        pickupTime: new Date(),
      });

      // Get donation details
      const donation = await storage.getDonation(task.donationId);
      if (donation) {
        // Notify donor
        await storage.createNotification({
          recipientId: donation.donorId,
          type: 'task_accepted',
          title: 'Delivery Driver Assigned',
          message: `A delivery driver has accepted your donation and will pick it up soon. Estimated pickup time: ${task.estimatedTime} minutes`,
          relatedDonationId: donation.id,
          relatedUserId: user.id,
        });

        // Notify NGO
        await storage.createNotification({
          recipientId: task.ngoId,
          type: 'task_accepted',
          title: 'Driver Assigned for Delivery',
          message: `A delivery driver has accepted the task. Food will be delivered in approximately ${task.estimatedTime} minutes.`,
          relatedDonationId: donation.id,
          relatedUserId: user.id,
        });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error('Accept task error:', error);
      res.status(500).json({ error: 'Failed to accept task' });
    }
  });

  app.post("/api/tasks/:id/reject", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (user.role !== 'volunteer') {
        return res.status(403).json({ error: 'Only volunteers can reject tasks' });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Find another available volunteer
      const allUsers = await storage.getAllUsers();
      const availableVolunteers = allUsers.filter(
        u => u.role === 'volunteer' && u.isVerified && u.id !== user.id
      );

      if (availableVolunteers.length === 0) {
        const updatedTask = await storage.updateTask(id, {
          status: 'assigned',
        });
        return res.json(updatedTask);
      }

      // Reassign to another volunteer
      const newVolunteer = availableVolunteers[0];
      const updatedTask = await storage.updateTask(id, {
        volunteerId: newVolunteer.id,
        status: 'assigned',
      });

      // Notify new volunteer
      await storage.createNotification({
        recipientId: newVolunteer.id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new delivery task',
        relatedDonationId: task.donationId,
        relatedUserId: null,
      });

      res.json(updatedTask);
    } catch (error) {
      console.error('Reject task error:', error);
      res.status(500).json({ error: 'Failed to reject task' });
    }
  });

  // Admin Routes
  app.get("/api/admin/pending-users", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const pendingUsers = await storage.getPendingUsers();
      const usersWithoutPasswords = pendingUsers.map(u => {
        const { password, ...rest } = u;
        return rest;
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Get pending users error:', error);
      res.status(500).json({ error: 'Failed to fetch pending users' });
    }
  });

  app.post("/api/admin/users/:id/verify", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, { isVerified: true });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Notify user
      await storage.createNotification({
        recipientId: id,
        type: 'account_verified',
        title: 'Account Verified',
        message: 'Your account has been verified. You can now access the platform.',
        relatedDonationId: null,
        relatedUserId: null,
      });

      res.json({ message: 'User verified successfully' });
    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({ error: 'Failed to verify user' });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Notification Routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const notifications = await storage.getNotificationsByUser(user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.post("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Update user profile with new location
  app.patch("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const { donorProfile, ngoProfile, volunteerProfile } = req.body;

      const updatedUser = await storage.updateUser(user.id, {
        ...(donorProfile && { donorProfile }),
        ...(ngoProfile && { ngoProfile }),
        ...(volunteerProfile && { volunteerProfile }),
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userResponse = { ...updatedUser };
      delete (userResponse as any).password;

      res.json(userResponse);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Create HTTP server and Socket.IO
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO setup for real-time features
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Store io instance for use in routes
  (app as any).io = io;

  return httpServer;
}
