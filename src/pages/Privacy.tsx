import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-gray max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-600 mb-8">Effective Date: August 2, 2025</p>

            <div className="space-y-6">
              <div>
                <p className="text-gray-700 leading-relaxed">
                  This Privacy Policy describes how Flikkt ("Flikkt," "we," "us," or "our") collects, uses, discloses, and protects your information when you use our mobile application and associated services (collectively, the "Service").
                </p>
              </div>

              <div>
                <p className="text-gray-700 leading-relaxed">
                  By accessing or using the Service, you agree to the terms of this Privacy Policy. If you do not agree with our practices, please do not use the Service.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-gray-800 mb-2">a. Personal Information You Provide to Us</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We collect personal information that you voluntarily provide when you:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                  <li>Register for an account (e.g. name, email address)</li>
                  <li>Enter medications or supplements</li>
                  <li>Contact us via support channels</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-2">b. Health Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You may voluntarily input medication, supplement, or other health-related data into the app. This data is used only to provide personalized recommendations and is not shared with any third parties for advertising purposes.
                </p>

                <h3 className="text-lg font-medium text-gray-800 mb-2">c. Automatically Collected Information</h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  When you use the app, we may collect:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                  <li>Device information (e.g. device model, OS version)</li>
                  <li>App usage data (e.g. screens viewed, items scanned)</li>
                  <li>Diagnostic and performance data (e.g. crash reports)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  This data is collected for app improvement and support purposes only.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                  We may use your information to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Provide core app features (e.g. food compatibility scoring, conflict detection)</li>
                  <li>Improve and personalize the Service</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Monitor and analyze app usage and trends</li>
                  <li>Enforce our terms and comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Sharing of Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, rent, or share your personal or health-related data with third-party advertisers or data brokers.
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">
                  We may share information with:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Service providers under strict confidentiality who assist us in operating the app (e.g. database hosting)</li>
                  <li>Law enforcement or regulators when required by law</li>
                  <li>Successors in the event of a business transfer (e.g. merger or acquisition)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your information only for as long as needed to provide the Service, fulfill legal obligations, resolve disputes, or enforce agreements. You may request data deletion at any time (see Section 7).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational safeguards to protect your personal and health information. While we strive to protect your data, no method of transmission or storage is 100% secure.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  The Service is not intended for use by individuals under the age of 13. We do not knowingly collect information from children. If we learn we have collected personal data from a child, we will delete it.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Privacy Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction or deletion of your data</li>
                  <li>Withdraw consent to data processing (where applicable)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  To exercise these rights, contact: <a href="mailto:support@flikkt.com" className="text-green-600 hover:text-green-700">support@flikkt.com</a>
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Third-Party Services</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may use third-party service providers (e.g. Supabase, Stripe) for storage, authentication, or payments. These providers are contractually bound to comply with data protection laws.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Users</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you are accessing the Service from outside the United States, your information may be transferred to and stored in the U.S. By using the Service, you consent to the transfer of your data to the United States.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy at any time. If material changes are made, we will notify users via the app or email. Your continued use of the Service after such changes constitutes your acceptance.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="font-medium text-gray-900">Flikkt</p>
                  <p className="text-gray-700">Email: <a href="mailto:support@flikkt.com" className="text-green-600 hover:text-green-700">support@flikkt.com</a></p>
                  <p className="text-gray-700">Website: <a href="https://flikkt.com" className="text-green-600 hover:text-green-700">https://flikkt.com</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;