import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Package, Building2, Heart, Truck, ChevronRight, ArrowLeft, Navigation, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { userRoles } from '@shared/schema';

type Role = typeof userRoles[number];

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [isLoading, setIsLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    latitude: 40.7128,
    longitude: -74.0060,
    organizationName: '',
    registrationNumber: '',
    capacity: '',
    vehicleType: '',
  });

  const requestGeolocation = () => {
    setGeoLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast({
            title: 'Location Captured',
            description: `Latitude: ${position.coords.latitude.toFixed(4)}, Longitude: ${position.coords.longitude.toFixed(4)}`,
          });
          setGeoLoading(false);
        },
        () => {
          toast({
            title: 'Location Access Denied',
            description: 'Please enable location permissions to use this feature.',
            variant: 'destructive',
          });
          setGeoLoading(false);
        }
      );
    } else {
      toast({
        title: 'Geolocation Unavailable',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      setGeoLoading(false);
    }
  };

  const roles = [
    {
      value: 'donor' as Role,
      title: 'Food Donor',
      icon: Building2,
      description: 'Restaurants, stores, or caterers with surplus food',
      color: 'bg-blue-500',
    },
    {
      value: 'ngo' as Role,
      title: 'NGO',
      icon: Heart,
      description: 'Organizations accepting food donations',
      color: 'bg-green-500',
    },
    {
      value: 'volunteer' as Role,
      title: 'Volunteer',
      icon: Truck,
      description: 'Help deliver food from donors to NGOs',
      color: 'bg-purple-500',
    },
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: selectedRole,
      };

      if (selectedRole === 'donor') {
        payload.donorProfile = {
          businessName: formData.businessName,
          businessType: formData.businessType,
          address: {
            ...formData.address,
            coordinates: [formData.latitude, formData.longitude] as [number, number],
          },
        };
      } else if (selectedRole === 'ngo') {
        payload.ngoProfile = {
          organizationName: formData.organizationName,
          registrationNumber: formData.registrationNumber,
          address: {
            ...formData.address,
            coordinates: [formData.latitude, formData.longitude] as [number, number],
          },
          capacity: parseInt(formData.capacity) || 0,
          acceptedCategories: [],
        };
      } else if (selectedRole === 'volunteer') {
        payload.volunteerProfile = {
          vehicleType: formData.vehicleType,
          availability: [],
          currentLocation: {
            coordinates: [formData.latitude, formData.longitude] as [number, number],
          },
          completedTasks: 0,
        };
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast({
        title: 'Registration successful!',
        description: 'Your account is pending verification. We\'ll notify you once approved.',
      });

      navigate('/login');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <Link href="/">
          <div className="flex items-center gap-2 mb-6 cursor-pointer hover-elevate w-fit">
            <Package className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">FoodRescue</span>
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              {step === 'role' ? 'Choose how you want to contribute' : `Sign up as a ${selectedRole}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'role' ? (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {roles.map((role) => (
                    <motion.div
                      key={role.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelect(role.value)}
                      className="cursor-pointer"
                      data-testid={`card-role-${role.value}`}
                    >
                      <Card className="h-full hover-elevate transition-all duration-300 border-2 hover:border-primary">
                        <CardContent className="p-6 text-center">
                          <div className={`w-16 h-16 rounded-full ${role.color} bg-opacity-10 flex items-center justify-center mx-auto mb-4`}>
                            <role.icon className={`w-8 h-8 text-${role.color.split('-')[1]}-600`} />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                          <ChevronRight className="w-5 h-5 mx-auto mt-4 text-primary" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.form
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep('role')}
                    className="mb-4"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to role selection
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        data-testid="input-fullname"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                        data-testid="input-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  {selectedRole === 'donor' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            required
                            data-testid="input-business-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="businessType">Business Type</Label>
                          <Input
                            id="businessType"
                            value={formData.businessType}
                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            required
                            data-testid="input-business-type"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={formData.address.street}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, street: e.target.value } 
                          })}
                          required
                          data-testid="input-street"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.address.city}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              address: { ...formData.address, city: e.target.value } 
                            })}
                            required
                            data-testid="input-city"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.address.state}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              address: { ...formData.address, state: e.target.value } 
                            })}
                            required
                            data-testid="input-state"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={formData.address.pincode}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              address: { ...formData.address, pincode: e.target.value } 
                            })}
                            required
                            data-testid="input-pincode"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRole === 'ngo' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="organizationName">Organization Name</Label>
                          <Input
                            id="organizationName"
                            value={formData.organizationName}
                            onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                            required
                            data-testid="input-org-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="registrationNumber">Registration Number</Label>
                          <Input
                            id="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                            required
                            data-testid="input-reg-number"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Daily Capacity (meals)</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          required
                          data-testid="input-capacity"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={formData.address.street}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            address: { ...formData.address, street: e.target.value } 
                          })}
                          required
                          data-testid="input-street"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.address.city}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              address: { ...formData.address, city: e.target.value } 
                            })}
                            required
                            data-testid="input-city"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.address.state}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              address: { ...formData.address, state: e.target.value } 
                            })}
                            required
                            data-testid="input-state"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={formData.address.pincode}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              address: { ...formData.address, pincode: e.target.value } 
                            })}
                            required
                            data-testid="input-pincode"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.0001"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                            data-testid="input-latitude"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.0001"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                            data-testid="input-longitude"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={requestGeolocation}
                        disabled={geoLoading}
                        className="w-full"
                        data-testid="button-get-location-ngo"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {geoLoading ? 'Getting Location...' : 'Use My Current Location'}
                      </Button>

                      {formData.latitude && formData.longitude && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-sm">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div className="flex-1">
                            <p className="font-medium text-emerald-900 dark:text-emerald-100">Location Captured</p>
                            <p className="text-emerald-700 dark:text-emerald-300">{formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedRole === 'volunteer' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Input
                          id="vehicleType"
                          value={formData.vehicleType}
                          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                          placeholder="e.g., Bike, Car, Van"
                          required
                          data-testid="input-vehicle-type"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.0001"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                            data-testid="input-latitude"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.0001"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                            data-testid="input-longitude"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={requestGeolocation}
                        disabled={geoLoading}
                        className="w-full"
                        data-testid="button-get-location-volunteer"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {geoLoading ? 'Getting Location...' : 'Use My Current Location'}
                      </Button>

                      {formData.latitude && formData.longitude && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-sm">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <div className="flex-1">
                            <p className="font-medium text-emerald-900 dark:text-emerald-100">Location Captured</p>
                            <p className="text-emerald-700 dark:text-emerald-300">{formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
