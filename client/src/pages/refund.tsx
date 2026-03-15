import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Refund() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto prose-sm">
          <h1 className="text-xl font-bold tracking-tight mb-6" data-testid="refund-heading">Refund &amp; Cancellation Policy</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: March 14, 2026</p>

          <div className="space-y-6 text-sm text-foreground leading-relaxed">
            <div>
              <h2 className="text-base font-semibold mb-2">Subscription Plans</h2>
              <p className="text-muted-foreground mb-3">
                All subscription plans (Basic at $395/mo, Premium at $595/mo, Enterprise at $995/mo) are billed monthly in advance and may be cancelled at any time.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li>You may cancel your subscription from your dashboard settings or by emailing support@bhseointelligence.com.</li>
                <li>Cancellation takes effect at the end of the current billing period. You retain full access until then.</li>
                <li>No partial-month refunds are issued for the remaining days in a billing cycle.</li>
                <li>If you cancel within the first 14 days of your initial subscription, you may request a full refund of the first month's charge, provided fewer than 2 audit reports have been generated.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">One-Time Audit ($1,997)</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li>Full refund within 7 days of purchase if the audit report has not yet been delivered.</li>
                <li>Once the audit report has been delivered, no refund is available, as the service has been completed.</li>
                <li>If you are dissatisfied with the audit quality, contact support within 14 days and we will revise the report or issue a partial credit toward a subscription plan.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">Enterprise and Multi-Site Plans</h2>
              <p className="text-muted-foreground">
                Enterprise plans with additional site fees ($395 per additional site) follow the same cancellation terms. Removing an additional site reduces your next billing cycle charge. No refunds are issued for partial-month usage of additional sites.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">How to Request a Refund</h2>
              <p className="text-muted-foreground">
                Email support@bhseointelligence.com with your account email and order details. Refund requests are processed within 5–10 business days. Refunds are issued to the original payment method.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">Free SEO Score Tool</h2>
              <p className="text-muted-foreground">
                The free SEO score tool is provided at no cost and does not involve any payment or refund considerations.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">Chargebacks</h2>
              <p className="text-muted-foreground">
                If you believe a charge is unauthorized, please contact us before initiating a chargeback with your bank. We will work with you to resolve billing issues promptly. Disputed charges that result in chargebacks may result in account suspension until resolved.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">Contact</h2>
              <p className="text-muted-foreground">
                For refund requests or billing questions:<br />
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
