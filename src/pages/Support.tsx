import { ArrowLeft, Mail, MessageSquare, Phone, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <div className="ml-auto">
            <span className="text-lg font-semibold">Flikkt Support</span>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find answers to common questions or get in touch with our support team
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search for help..." 
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Email Support</CardTitle>
              <CardDescription>Get help via email</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Average response time: 2-4 hours
              </p>
              <Button asChild className="w-full">
                <a href="mailto:support@flikkt.com">
                  Contact Support
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <CardDescription>Chat with our team</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Available 9 AM - 6 PM EST
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Phone className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Phone Support</CardTitle>
              <CardDescription>Call our support line</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Premium subscribers only
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>How does Flikkt analyze food-medication interactions?</AccordionTrigger>
              <AccordionContent>
                Flikkt uses advanced AI to analyze your medications against food ingredients and provides personalized compatibility scores. Our system considers known drug-food interactions, absorption effects, and timing recommendations based on current medical research.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Is my health information secure?</AccordionTrigger>
              <AccordionContent>
                Yes, we take your privacy seriously. All health data is encrypted in transit and at rest. We never sell your personal information to third parties, and we comply with industry-standard security practices. See our Privacy Policy for full details.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can I use Flikkt if I'm not taking any medications?</AccordionTrigger>
              <AccordionContent>
                Absolutely! Flikkt can still provide valuable nutritional information and help you make informed food choices. You can use the food scanner to learn about ingredients, allergens, and nutritional content.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>How accurate are the interaction warnings?</AccordionTrigger>
              <AccordionContent>
                Our AI is trained on extensive medical databases and research, but Flikkt should not replace professional medical advice. Always consult with your healthcare provider for serious concerns or before making significant changes to your diet or medication routine.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>What should I do if I can't scan a food item?</AccordionTrigger>
              <AccordionContent>
                If scanning doesn't work, try cleaning your camera lens, ensuring good lighting, or entering the food information manually. You can also take a photo of the ingredients list and upload it for analysis.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>How do I update my medication list?</AccordionTrigger>
              <AccordionContent>
                Go to the Medications tab in the app, then tap the "+" button to add new medications or tap on existing ones to edit or remove them. Make sure to include dosage and frequency for the most accurate recommendations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Can I export my data?</AccordionTrigger>
              <AccordionContent>
                Yes, you can request a copy of your data by emailing support@flikkt.com. We'll provide your medication list, scan history, and profile information in a portable format within 30 days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
              <AccordionContent>
                You can manage your subscription through the Billing section in the app settings, or contact support@flikkt.com for assistance. Cancellations take effect at the end of your current billing period.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Still need help?</h3>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="space-y-2">
            <Button asChild size="lg">
              <a href="mailto:support@flikkt.com">
                Email Support Team
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              support@flikkt.com • Response within 2-4 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;