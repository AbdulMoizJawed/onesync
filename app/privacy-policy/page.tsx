"use client"

import { useAuth } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function PrivacyPolicyPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Privacy Policy</h1>
              <p className="text-gray-400 text-sm sm:text-base">Last updated: June 15, 2024</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 shadow-md space-y-6 text-gray-300 text-sm sm:text-base">
              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">1. Introduction</h2>
                <p className="mb-3">
                  Welcome to OneSync ("we," "our," or "us"). We are committed to protecting your privacy and handling your data with transparency and care.
                </p>
                <p>
                  This Privacy Policy explains how we collect, use, and share information about you when you use our music distribution platform, websites, and other services (collectively, the "Services").
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">2. Information We Collect</h2>
                <h3 className="text-lg font-medium text-white mb-2">2.1 Information You Provide</h3>
                <ul className="list-disc pl-5 mb-4 space-y-2">
                  <li>Account information: When you create an account, we collect your name, email address, and password.</li>
                  <li>Profile information: Information you add to your profile, such as a profile picture, biography, or social media links.</li>
                  <li>Music and content: Music files, artwork, lyrics, and other content you upload to our platform.</li>
                  <li>Payment information: Payment details when you subscribe to our services or receive royalty payments.</li>
                  <li>Communications: Information you provide when contacting our support team or participating in our forums.</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-2">2.2 Information We Collect Automatically</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Usage data: Information about how you use our Services, including which features you use and how often.</li>
                  <li>Device information: Information about the device you use to access our Services, including device type, operating system, and browser type.</li>
                  <li>Log data: Server logs, IP addresses, and other technical data when you use our Services.</li>
                  <li>Cookies and similar technologies: Information collected through cookies and similar technologies to enhance your experience.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                <p className="mb-3">We use the information we collect to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Provide, maintain, and improve our Services</li>
                  <li>Process transactions and distribute royalty payments</li>
                  <li>Distribute your music to streaming platforms and stores</li>
                  <li>Communicate with you about our Services, updates, and promotional offers</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Protect against fraudulent or unauthorized transactions</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">4. Sharing Your Information</h2>
                <p className="mb-3">We may share your information with:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Music platforms and stores: To distribute your music as requested</li>
                  <li>Service providers: Third-party vendors who help us provide our Services</li>
                  <li>Affiliates: Our subsidiaries and affiliated companies</li>
                  <li>Legal requirements: When required by law or to protect our rights</li>
                  <li>Business transfers: In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">5. Your Rights and Choices</h2>
                <p className="mb-3">Depending on your location, you may have certain rights regarding your personal information:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Access: Request access to your personal information</li>
                  <li>Correction: Update or correct your personal information</li>
                  <li>Deletion: Request deletion of your personal information</li>
                  <li>Restriction: Request restrictions on our use of your personal information</li>
                  <li>Portability: Request a copy of your personal information in a structured, machine-readable format</li>
                  <li>Objection: Object to our processing of your personal information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">6. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, accidental loss, alteration, or destruction. However, no internet transmission is ever completely secure, and we cannot guarantee the security of information transmitted through our Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">7. International Data Transfers</h2>
                <p>
                  Your information may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws different from your country. By using our Services, you consent to the transfer of your information to countries outside your country of residence.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">8. Children's Privacy</h2>
                <p>
                  Our Services are not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">9. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">10. Contact Us</h2>
                <p>
                  If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@onesync.io.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
