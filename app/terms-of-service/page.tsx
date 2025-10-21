"use client"

import { useAuth } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function TermsOfServicePage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Terms of Service</h1>
              <p className="text-gray-400 text-sm sm:text-base">Last updated: June 15, 2024</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 shadow-md space-y-6 text-gray-300 text-sm sm:text-base">
              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p className="mb-3">
                  Welcome to OneSync. By accessing or using our music distribution platform, websites, and other services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Services.
                </p>
                <p>
                  These Terms constitute a legally binding agreement between you and OneSync ("we," "our," or "us"). Please read them carefully.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">2. Changes to Terms</h2>
                <p>
                  We may modify these Terms at any time. If we make changes, we will provide notice by updating the "Last updated" date at the top of these Terms. Your continued use of the Services after any changes indicates your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">3. Using Our Services</h2>
                <h3 className="text-lg font-medium text-white mb-2">3.1 Eligibility</h3>
                <p className="mb-3">
                  You must be at least 16 years old to use our Services. If you are under 18, you must have your parent or legal guardian's permission.
                </p>

                <h3 className="text-lg font-medium text-white mb-2">3.2 Account Registration</h3>
                <p className="mb-3">
                  To use some features of our Services, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep this information up-to-date. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                </p>

                <h3 className="text-lg font-medium text-white mb-2">3.3 Prohibited Activities</h3>
                <p className="mb-3">You agree not to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Use the Services in any way that violates applicable laws or regulations</li>
                  <li>Infringe or violate the rights of others, including intellectual property rights</li>
                  <li>Upload or distribute content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
                  <li>Attempt to gain unauthorized access to our Services or systems</li>
                  <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
                  <li>Use automated means (bots, scripts) to access or use the Services without our permission</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">4. Content and Licensing</h2>
                <h3 className="text-lg font-medium text-white mb-2">4.1 Your Content</h3>
                <p className="mb-3">
                  By uploading music, artwork, or other content to our platform, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, distribute, and display that content solely for the purpose of providing and improving our Services and distributing your music to the platforms you select.
                </p>

                <h3 className="text-lg font-medium text-white mb-2">4.2 Content Ownership and Rights</h3>
                <p className="mb-3">
                  You retain all ownership rights to your content. You represent and warrant that:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You own or have the necessary rights to the content you upload</li>
                  <li>Your content does not infringe on the rights of any third party</li>
                  <li>Your content complies with these Terms and all applicable laws</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-2">4.3 Content Removal</h3>
                <p>
                  We reserve the right to remove any content that violates these Terms or that we determine, in our sole discretion, is inappropriate or objectionable.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">5. Payments and Royalties</h2>
                <h3 className="text-lg font-medium text-white mb-2">5.1 Service Fees</h3>
                <p className="mb-3">
                  We may charge fees for certain aspects of our Services. All fees are listed on our website and may be updated from time to time. You agree to pay all applicable fees.
                </p>

                <h3 className="text-lg font-medium text-white mb-2">5.2 Royalty Payments</h3>
                <p className="mb-3">
                  We will distribute royalties to you in accordance with our royalty payment terms, which are available on our website. Royalty rates and payment schedules may vary based on your agreement with us and the platforms where your music is distributed.
                </p>

                <h3 className="text-lg font-medium text-white mb-2">5.3 Taxes</h3>
                <p>
                  You are responsible for all taxes associated with your use of our Services and any income you receive through our platform. We may withhold taxes from royalty payments if required by law.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">6. Termination</h2>
                <p className="mb-3">
                  We may terminate or suspend your account and access to our Services at any time, for any reason, without notice. You may terminate your account at any time by contacting us.
                </p>
                <p>
                  Upon termination, certain provisions of these Terms will continue to apply, including sections related to ownership, limitation of liability, and dispute resolution.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">7. Disclaimer of Warranties</h2>
                <p className="mb-3 uppercase">
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
                <p className="mb-3 uppercase">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICES.
                </p>
                <p>
                  OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICES SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO US DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">9. Indemnification</h2>
                <p>
                  You agree to indemnify, defend, and hold harmless OneSync and its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or relating to your use of the Services, your content, or your violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">10. Governing Law and Dispute Resolution</h2>
                <p className="mb-3">
                  These Terms shall be governed by and construed in accordance with the laws of the state of California, without regard to its conflict of law principles.
                </p>
                <p>
                  Any dispute arising from or relating to these Terms or the Services shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules. The arbitration shall take place in San Francisco, California.
                </p>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">11. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us at terms@onesync.io.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
