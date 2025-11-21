import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, MessageSquare, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Help() {
  const faqs = [
    {
      question: 'How do I create a donation as a Donor?',
      answer: 'Go to your Dashboard, click on "Create Donation" tab, fill in the food details, location, and expiry time, then submit. NGOs in your area will be notified.',
    },
    {
      question: 'How do NGOs accept donations?',
      answer: 'NGOs can see available donations in their Browse Donations section. Click "Accept Donation" to accept it, and a volunteer will be assigned automatically.',
    },
    {
      question: 'How do Volunteers get tasks?',
      answer: 'When an NGO accepts a donation, a delivery task is automatically created and assigned to available volunteers. Check your Dashboard for new tasks.',
    },
    {
      question: 'How can I cancel a donation?',
      answer: 'You can cancel a donation from your Donations list if it hasn\'t been accepted yet. Once accepted, please contact the NGO directly.',
    },
    {
      question: 'What information should I provide about food?',
      answer: 'Provide the food category, name, quantity, expiry time, dietary information, and any special handling instructions.',
    },
    {
      question: 'Is there a fee for using FoodRescue?',
      answer: 'No, FoodRescue is completely free. Our mission is to reduce food waste and help communities.',
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'support@foodrescue.com',
      action: 'Coming Soon',
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '+91 123-456-7890',
      action: 'Coming Soon',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      value: 'Available 24/7',
      action: 'Coming Soon',
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2" data-testid="text-help-title">
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          Find answers to common questions or contact our support team
        </p>
      </motion.div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6" data-testid="text-faq-section">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover-elevate transition-all">
                <CardHeader>
                  <CardTitle className="text-lg" data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground" data-testid={`faq-answer-${index}`}>
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6" data-testid="text-contact-section">
          Contact Us
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover-elevate transition-all h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col items-center text-center flex-1">
                    <div className="p-3 bg-primary/10 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2" data-testid={`contact-${method.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {method.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {method.value}
                    </p>
                    <Button variant="outline" disabled className="mt-auto">
                      {method.action}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Card className="mt-8 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1" data-testid="text-faq-hint">
                Can't find what you're looking for?
              </h3>
              <p className="text-sm text-muted-foreground">
                Our support team is here to help. Reach out to us via email or chat, and we'll get back to you as soon as possible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
