import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy – Before The Build",
  description: "Privacy Policy for Before The Build",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* Header */}
      <header className="border-b border-[#e8e6e1] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1a1a2e]">
            Before The Build
          </Link>
          <Link
            href="/"
            className="text-sm text-[#7a7a8a] hover:text-[#1a1a2e] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mb-12 text-sm text-[#7a7a8a]">Effective Date: March 23, 2026</p>

        <div className="space-y-10 text-[#4a4a5a] leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">1. Introduction</h2>
            <p>
              Before The Build (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website and
              application located at <strong>renoheaven.com</strong> (the &quot;Service&quot;). This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you use our
              Service, including any data obtained through third-party platforms such as the Pinterest API.
            </p>
            <p className="mt-3">
              By accessing or using the Service, you agree to the terms of this Privacy Policy. If you do not
              agree, please do not use the Service.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">2. Information We Collect</h2>

            <h3 className="mt-4 mb-2 text-base font-semibold text-[#1a1a2e]">
              2.1 Information You Provide
            </h3>
            <ul className="ml-6 list-disc space-y-1">
              <li>Account registration details (name, email address) managed securely through Firebase Authentication</li>
              <li>Household and project information you enter during onboarding</li>
              <li>Design preferences, room scans, goals, and style selections</li>
              <li>Messages and content shared through the chat feature</li>
            </ul>

            <h3 className="mt-4 mb-2 text-base font-semibold text-[#1a1a2e]">
              2.2 Information from Third-Party Services (Pinterest)
            </h3>
            <p>
              When you connect your Pinterest account, we may access the following data through the Pinterest
              API in accordance with Pinterest&apos;s API Terms of Service:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Your Pinterest profile information (name, profile image, username)</li>
              <li>Your public pins, boards, and saved content</li>
              <li>Pin metadata such as images, descriptions, and links</li>
            </ul>
            <p className="mt-2">
              We only request the minimum permissions necessary to provide our Service. You can revoke our
              access to your Pinterest data at any time through your Pinterest account settings.
            </p>

            <h3 className="mt-4 mb-2 text-base font-semibold text-[#1a1a2e]">
              2.3 Automatically Collected Information
            </h3>
            <ul className="ml-6 list-disc space-y-1">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Log data (IP address, access times, pages viewed, referring URL)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Provide, maintain, and improve our Service</li>
              <li>
                Generate personalized renovation design recommendations and inspiration based on your
                preferences and Pinterest data
              </li>
              <li>Create and manage your Build Book and project timelines</li>
              <li>Power AI-assisted features including chat and design suggestions</li>
              <li>Communicate with you about your account or the Service</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              <strong>Pinterest Data:</strong> Data obtained through the Pinterest API is used solely to
              provide design inspiration and personalized recommendations within our Service. We do not use
              Pinterest data for advertising or sell it to third parties.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">
              4. How We Share Your Information
            </h2>
            <p>We do not sell your personal information. We may share information in the following cases:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>
                <strong>Service Providers:</strong> With trusted third-party vendors who assist in operating
                our Service (e.g., hosting, analytics, AI processing), bound by confidentiality obligations.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, regulation, or legal process, or
                to protect the rights, property, or safety of Before The Build, our users, or the public.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of
                assets, in which case your information may be transferred as part of that transaction.
              </li>
              <li>
                <strong>With Your Consent:</strong> When you have given us explicit permission to share your
                information.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Pinterest Data:</strong> We do not share, sell, or transfer data obtained from the
              Pinterest API to any third party, except as required to operate the Service through our
              infrastructure providers, and always in compliance with Pinterest&apos;s API Terms.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to
              provide our Service. If you delete your account, we will delete or anonymize your personal
              data within 30 days, except where retention is required by law.
            </p>
            <p className="mt-2">
              Pinterest data is cached only for the duration needed to provide recommendations and is
              refreshed or deleted in accordance with Pinterest&apos;s data retention policies.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption in
              transit (TLS/SSL) and at rest, access controls, and regular security reviews. However, no
              method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">7. Your Rights and Choices</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1">
              <li>Access, correct, or delete your personal information</li>
              <li>Withdraw consent for data processing</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>
                Revoke third-party access (e.g., disconnect Pinterest) through your account settings or
                directly through the third-party platform
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at the address below.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">8. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain sessions, remember preferences, and
              understand how you interact with our Service. You can manage cookie preferences through your
              browser settings. Disabling cookies may affect Service functionality.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">9. Children&apos;s Privacy</h2>
            <p>
              Our Service is not directed to individuals under the age of 13. We do not knowingly collect
              personal information from children under 13. If we learn that we have collected such
              information, we will take steps to delete it promptly.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">
              10. Third-Party Links and Services
            </h2>
            <p>
              Our Service may contain links to third-party websites or services (including Pinterest). We
              are not responsible for the privacy practices of these third parties. We encourage you to read
              their privacy policies before providing any information to them.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">
              11. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              posting the new policy on this page and updating the &quot;Effective Date&quot; above. Your
              continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-[#1a1a2e]">12. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
            <div className="mt-3 rounded-lg border border-[#e8e6e1] bg-[#faf9f7] p-5">
              <p className="font-semibold text-[#1a1a2e]">Before The Build</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:privacy@renoheaven.com"
                  className="text-[#6c63ff] hover:underline"
                >
                  privacy@renoheaven.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e6e1] bg-white py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-[#9a9aaa]">
          © 2026 Before The Build. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
