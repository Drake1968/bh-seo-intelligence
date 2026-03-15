import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto prose-sm">
          <h1 className="text-xl font-bold tracking-tight mb-6" data-testid="terms-heading">Terms of Service</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: March 14, 2026</p>

          <div className="space-y-6 text-sm text-foreground leading-relaxed">
            <div>
              <h2 className="text-base font-semibold mb-2">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using BH SEO Intelligence ("Platform"), operated by BH SEO Intelligence LLC, you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms apply to all visitors, users, and subscribers.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">2. Description of Service</h2>
              <p className="text-muted-foreground">
                BH SEO Intelligence provides automated SEO auditing, monitoring, and intelligence services specifically designed for behavioral health treatment providers. Services include technical SEO audits, keyword ranking tracking, competitor analysis, local SEO monitoring, content strategy recommendations, admissions estimation, and automated reporting. Services are delivered through a web-based dashboard accessible via subscription or one-time purchase.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">3. Account Registration</h2>
              <p className="text-muted-foreground">
                To access certain features, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">4. Subscription Plans and Payments</h2>
              <p className="text-muted-foreground">
                Subscriptions are billed monthly in advance. One-time audit purchases are charged at the time of purchase. All prices are listed in US Dollars. Payment is processed securely through Stripe. By subscribing, you authorize recurring charges to your payment method until you cancel. Prices may change with 30 days' notice.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">5. Cancellation and Refunds</h2>
              <p className="text-muted-foreground">
                You may cancel your subscription at any time from your dashboard or by contacting support. Cancellation takes effect at the end of the current billing period. No partial-month refunds are issued for subscription cancellations. One-time audit purchases are eligible for a full refund within 7 days if the audit report has not yet been delivered. See our Refund Policy for full details.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">6. Acceptable Use</h2>
              <p className="text-muted-foreground">
                You agree not to: (a) use the Platform for any unlawful purpose; (b) attempt to gain unauthorized access to any part of the Platform; (c) interfere with or disrupt the Platform's servers or networks; (d) resell or redistribute Platform data without authorization; (e) submit false or misleading information; (f) use automated systems to scrape or extract data from the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">7. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, functionality, and data analyses provided through the Platform are owned by BH SEO Intelligence LLC and are protected by copyright, trademark, and other intellectual property laws. Reports generated for your account may be used internally and shared with your team or agency clients under your account.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">8. Data Accuracy Disclaimer</h2>
              <p className="text-muted-foreground">
                SEO data, rankings, admissions estimates, and competitor information are provided as approximations based on publicly available data and proprietary algorithms. We do not guarantee the accuracy, completeness, or timeliness of any data. Admissions estimates are projections and should not be relied upon as financial forecasts. Always verify critical business decisions with independent data sources.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, BH SEO Intelligence LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of or inability to use the Platform, even if advised of the possibility of such damages. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">10. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless BH SEO Intelligence LLC, its officers, directors, employees, and agents from any claims, liabilities, damages, or expenses arising from your use of the Platform or violation of these Terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">11. Modifications to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. Material changes will be communicated via email or Platform notification at least 30 days before they take effect. Continued use of the Platform after changes constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">12. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the State of Georgia, without regard to its conflict of law provisions. Any disputes shall be resolved in the state or federal courts located in Clarke County, Georgia.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">13. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at:<br />
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
