import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto prose-sm">
          <h1 className="text-xl font-bold tracking-tight mb-6" data-testid="privacy-heading">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: March 14, 2026</p>

          <div className="space-y-6 text-sm text-foreground leading-relaxed">
            <div>
              <h2 className="text-base font-semibold mb-2">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">
                We collect information you provide directly when creating an account, purchasing services, or contacting us:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Name, email address, and organization name</li>
                <li>Treatment center website URL, location, and treatment category</li>
                <li>Billing information (processed securely by Stripe — we do not store card numbers)</li>
                <li>Communication preferences and support correspondence</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We automatically collect usage data including pages visited, features used, browser type, IP address, and device information through standard server logs.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>To provide, maintain, and improve our SEO auditing and monitoring services</li>
                <li>To process payments and manage your subscription</li>
                <li>To send service-related communications (reports, alerts, updates)</li>
                <li>To analyze usage patterns and improve Platform performance</li>
                <li>To respond to your requests and provide customer support</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">3. Data We Analyze</h2>
              <p className="text-muted-foreground">
                Our Platform analyzes publicly available data about your website and competitor websites, including: search engine rankings, website technical performance, page content, backlink profiles, Google Business Profile listings, and directory listings. This data is publicly accessible and is collected through standard web protocols. We do not access private or password-protected areas of any website.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">4. Information Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share information with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-2">
                <li>Stripe — for payment processing (subject to Stripe's privacy policy)</li>
                <li>Service providers who assist in operating the Platform, under confidentiality agreements</li>
                <li>Law enforcement or government agencies when required by law</li>
                <li>Successors in a merger, acquisition, or asset sale, with notice to users</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your information, including encryption in transit (TLS/SSL), secure authentication, and access controls. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your account information and SEO data for as long as your account is active. Upon cancellation, we retain data for 90 days to allow for reactivation, after which it is permanently deleted. Billing records are retained as required by law.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">7. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to: (a) access the personal information we hold about you; (b) request correction of inaccurate information; (c) request deletion of your account and associated data; (d) opt out of non-essential communications; (e) export your data in a machine-readable format. To exercise these rights, contact support@bhseointelligence.com.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use essential cookies for authentication and session management. We may use analytics cookies to understand how the Platform is used. You can control cookie preferences through your browser settings. The Platform does not respond to "Do Not Track" signals, as there is no industry standard for this technology.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                The Platform is not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn that we have collected information from a child under 18, we will promptly delete it.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. Material changes will be communicated via email or Platform notification. The "Last updated" date at the top indicates the latest revision.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">11. Contact</h2>
              <p className="text-muted-foreground">
                For privacy-related questions or requests, contact us at:<br />
                BH SEO Intelligence LLC<br />
                Email: support@bhseointelligence.com<br />
                Athens, Georgia
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
