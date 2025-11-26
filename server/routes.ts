import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";

const JWT_SECRET = process.env.JWT_SECRET || "foodrescue-secret-key-change-in-production";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

// Middleware to verify JWT token
function authenticateToken(req: Request, res: Response, next: NextFunction) {
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
      // Ensure each donation has donor information attached
      const withDonors = donations.map(d => ({
        ...d,
        donor: {
          id: d.donorId,
          fullName: 'Unknown Donor',
          donorProfile: { rating: 0, totalRatings: 0, ratingBreakdown: { foodQuality: 0, packaging: 0, accuracy: 0, communication: 0 } }
        }
      }));
      res.json(withDonors);
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

      // Fetch all users upfront for notifications
      const allUsers = await storage.getAllUsers();

      const updatedDonation = await storage.updateDonation(id, {
        status: 'accepted',
        matchedNGOId: user.id,
      });

      // Create notification for donor with location details
      const donorUser = allUsers.find(u => u.id === donation.donorId);
      const ngoName = user.ngoProfile?.organizationName || 'An NGO';
      const pickupLocation = donation.location?.address?.city || 'your location';
      
      await storage.createNotification({
        recipientId: donation.donorId,
        type: 'donation_accepted',
        title: 'Donation Accepted',
        message: `${ngoName} accepted your donation from ${pickupLocation}. Volunteer pickup starts soon.`,
        relatedDonationId: donation.id,
        relatedUserId: user.id,
      });

      // Emit Socket.IO event to donor for real-time update
      const io = (app as any).io;
      if (io) {
        io.to(`user_${donation.donorId}`).emit('donation_accepted', {
          donationId: donation.id,
          message: 'Your donation has been accepted!',
          ngoName,
        });
      }

      // Update donation to accepted status at 75% - ready for NGO to mark delivered
      await storage.updateDonation(id, {
        status: 'accepted',
        completionPercentage: 75,
      });

      res.json(updatedDonation);
    } catch (error) {
      console.error('Accept donation error:', error);
      res.status(500).json({ error: 'Failed to accept donation' });
    }
  });

  // Accept Ride - NGO initiates pickup
  app.patch("/api/donations/:id/accept-ride", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (user.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can accept rides' });
      }

      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (donation.status !== 'matched' || donation.completionPercentage !== 50) {
        return res.status(400).json({ error: 'Donation is not ready for ride assignment' });
      }

      const allUsers = await storage.getAllUsers();
      const volunteers = allUsers.filter(u => u.role === 'volunteer' && u.isVerified);
      
      if (volunteers.length === 0) {
        return res.status(400).json({ error: 'No available volunteers' });
      }

      const volunteer = volunteers[0];
      const pickupAddr = donation.location?.address || { street: 'Location', city: 'Unknown', state: '', pincode: '' };
      const pickupLocation = {
        address: `${pickupAddr.street}, ${pickupAddr.city}`,
        coordinates: donation.location?.coordinates || [0, 0],
      };

      const ngoUser = allUsers.find(u => u.id === user.id);
      const deliveryAddr = ngoUser?.ngoProfile?.address || { street: 'NGO Location', city: 'City', state: '', pincode: '' };
      const deliveryLocation = {
        address: `${deliveryAddr.street}, ${deliveryAddr.city}`,
        coordinates: ngoUser?.ngoProfile?.address?.coordinates || [0, 0],
      };

      const task = await storage.createTask({
        taskId: `task_${Date.now()}`,
        donationId: donation.id,
        volunteerId: volunteer.id,
        donorId: donation.donorId,
        ngoId: user.id,
        status: 'assigned',
        pickupLocation,
        deliveryLocation,
        estimatedTime: 30,
      });

      // Update donation to show task is assigned (still 50% but task exists)
      const updatedDonation = await storage.updateDonation(id, {
        assignedVolunteerId: volunteer.id,
        status: 'matched',
      });

      // Notify volunteer
      const pickupText = `${pickupAddr.street}, ${pickupAddr.city}`;
      const deliveryText = `${deliveryAddr.street}, ${deliveryAddr.city}`;

      await storage.createNotification({
        recipientId: volunteer.id,
        type: 'task_assigned',
        title: 'New Delivery Task',
        message: `Pick up ${donation.foodDetails.name} from ${pickupText} and deliver to ${user.ngoProfile?.organizationName || 'the NGO'} at ${deliveryText}`,
        relatedDonationId: donation.id,
        relatedUserId: null,
      });

      // Emit Socket.IO event
      const io = (app as any).io;
      if (io) {
        io.to(`user_${volunteer.id}`).emit('task_assigned', {
          taskId: task.id,
          donationId: donation.id,
          message: 'New delivery task assigned to you',
        });
      }

      res.json(updatedDonation);
    } catch (error) {
      console.error('Accept ride error:', error);
      res.status(500).json({ error: 'Failed to accept ride' });
    }
  });

  // Mark Donation as Delivered (NGO marks delivery complete)
  app.patch("/api/donations/:id/mark-delivered", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (user.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can mark deliveries' });
      }

      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (donation.status !== 'accepted' || donation.completionPercentage !== 75) {
        return res.status(400).json({ error: 'Donation is not ready to be marked as delivered' });
      }

      const updatedDonation = await storage.updateDonation(id, {
        status: 'delivered',
        completionPercentage: 100,
      });

      // Notify donor
      await storage.createNotification({
        recipientId: donation.donorId,
        type: 'delivery_completed',
        title: 'Delivery Completed',
        message: `Your donation has been successfully delivered. The NGO will provide feedback shortly.`,
        relatedDonationId: donation.id,
        relatedUserId: user.id,
      });

      // Emit Socket.IO event
      const io = (app as any).io;
      if (io) {
        io.to(`user_${donation.donorId}`).emit('delivery_completed', {
          donationId: donation.id,
          completionPercentage: 100,
          message: 'Your donation has been delivered!',
        });
      }

      res.json(updatedDonation);
    } catch (error) {
      console.error('Mark delivered error:', error);
      res.status(500).json({ error: 'Failed to mark as delivered' });
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

      // Get donation details and update to 75% completion
      const donation = await storage.getDonation(task.donationId);
      if (donation) {
        // Update donation status to "accepted" (75% completion)
        await storage.updateDonation(task.donationId, {
          status: 'accepted',
        });

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

        // Emit Socket.IO event for real-time update
        const io = (app as any).io;
        if (io) {
          io.to(`user_${donation.donorId}`).emit('task_accepted', {
            donationId: donation.id,
            completionPercentage: 75,
            message: 'Volunteer accepted your task - 75% complete',
          });
          io.to(`user_${task.ngoId}`).emit('task_accepted', {
            donationId: donation.id,
            completionPercentage: 75,
            message: 'Volunteer accepted the task',
          });
        }
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

  app.post("/api/tasks/:id/mark-delivered", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'volunteer') {
        return res.status(403).json({ error: 'Only volunteers can mark deliveries' });
      }

      const { id } = req.params;
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (task.volunteerId !== user.id) {
        return res.status(403).json({ error: 'You are not assigned to this task' });
      }

      const updatedTask = await storage.updateTask(id, {
        status: 'delivered',
        deliveryTime: new Date().toISOString(),
      });

      // Update donation status to delivered (100% completion)
      const updatedDonation = await storage.updateDonation(task.donationId, { status: 'delivered' });

      // Get donor details for notification
      const donor = await storage.getUser(task.donorId);
      
      // Notify NGO that delivery is complete - they should now rate the donor
      const ngoUser = await storage.getUser(task.ngoId);
      if (ngoUser) {
        await storage.createNotification({
          recipientId: ngoUser.id,
          type: 'delivery_completed',
          title: 'Delivery Completed',
          message: `Food delivery by ${user.fullName} is complete. Please rate the donor's quality.`,
          relatedDonationId: task.donationId,
          relatedUserId: user.id,
        });
      }

      // Notify donor that delivery is complete
      await storage.createNotification({
        recipientId: task.donorId,
        type: 'delivery_completed',
        title: 'Your Donation Delivered',
        message: `Your donation has been successfully delivered by our volunteer team. Thank you for your contribution!`,
        relatedDonationId: task.donationId,
        relatedUserId: user.id,
      });

      // Emit Socket.IO events for 100% completion
      const io = (app as any).io;
      if (io) {
        // Notify NGO - 100% complete, ready for rating
        if (ngoUser) {
          io.to(`user_${ngoUser.id}`).emit('delivery_completed', {
            taskId: id,
            donationId: task.donationId,
            completionPercentage: 100,
            message: 'Delivery completed - 100%',
          });
        }
        // Notify donor - 100% complete
        io.to(`user_${task.donorId}`).emit('delivery_completed', {
          donationId: task.donationId,
          completionPercentage: 100,
          message: 'Your donation delivery is complete!',
        });
      }

      // Return the updated donation with 100% completion
      res.json(updatedDonation);
    } catch (error) {
      console.error('Mark delivered error:', error);
      res.status(500).json({ error: 'Failed to mark delivery' });
    }
  });

  // Rating Routes
  app.post("/api/ratings", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can rate donors' });
      }

      const { donationId, donorId, rating, comment } = req.body;

      if (!donationId || !donorId || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const createdRating = await storage.createRating({
        donationId,
        ratedTo: donorId,
        ratedBy: user.id,
        ratedType: 'ngo',
        rating,
        comment: comment || '',
      });

      // Update donor profile rating
      const donor = await storage.getUser(donorId);
      if (donor && donor.donorProfile) {
        const currentRating = donor.donorProfile.rating || 0;
        const totalRatings = (donor.donorProfile.totalRatings || 0) + 1;
        const newRating = (currentRating * (totalRatings - 1) + rating) / totalRatings;

        await storage.updateUser(donorId, {
          donorProfile: {
            ...donor.donorProfile,
            rating: parseFloat(newRating.toFixed(1)),
            totalRatings,
          },
        });
      }

      // Notify donor of new rating
      await storage.createNotification({
        recipientId: donorId,
        type: 'donation_rated',
        title: 'Your Donation was Rated',
        message: `${user.fullName} rated your donation with ${rating} stars: "${comment}"`,
        relatedDonationId: donationId,
        relatedUserId: user.id,
      });

      res.status(201).json(createdRating);
    } catch (error) {
      console.error('Create rating error:', error);
      res.status(500).json({ error: 'Failed to create rating' });
    }
  });

  app.get("/api/ratings/donation/:donationId", authenticateToken, async (req, res) => {
    try {
      const { donationId } = req.params;
      const ratings = await storage.getRatingsByDonation(donationId);
      res.json(ratings);
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ error: 'Failed to fetch ratings' });
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

  // Get all users for admin map
  app.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const allUsers = await storage.getAllUsers();
      const usersResponse = allUsers.map(u => {
        const userCopy = { ...u };
        delete (userCopy as any).password;
        return userCopy;
      });

      res.json(usersResponse);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
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
