import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getUserByGithubId } from "@/server/src/db/actions";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const dbUser = await getUserByGithubId(String(user.id));

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's Stripe customer ID (you'll need to store this in your database)
    const stripeCustomerId = dbUser.stripeCustomerId; // Add this field to your user schema

    if (!stripeCustomerId) {
      // Return empty payment history for users without Stripe customer ID
      return NextResponse.json({
        success: true,
        data: { payments: [] },
      });
    }

    // Fetch payment history from Stripe
    const payments = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 50, // Adjust as needed
    });

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 50,
    });

    // Combine and format the data
    const paymentHistory = [];

    // Add invoices
    for (const invoice of invoices.data) {
      if (invoice.status === "paid") {
        paymentHistory.push({
          id: invoice.id,
          type: "subscription",
          amount: (invoice.amount_paid / 100).toFixed(2), // Convert from cents
          currency: invoice.currency.toUpperCase(),
          date: new Date(invoice.created * 1000).toISOString(),
          status: "completed",
          description: invoice.description || "Subscription Payment",
          invoiceNumber: invoice.number,
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf,
        });
      }
    }

    // Add one-time payments
    for (const payment of payments.data) {
      if (payment.status === "succeeded") {
        paymentHistory.push({
          id: payment.id,
          type: "one_time",
          amount: (payment.amount / 100).toFixed(2),
          currency: payment.currency.toUpperCase(),
          date: new Date(payment.created * 1000).toISOString(),
          status: "completed",
          description: payment.description || "One-time Payment",
          invoiceNumber: null,
          invoiceUrl: null,
          pdfUrl: null,
        });
      }
    }

    // Sort by date (most recent first)
    paymentHistory.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: { payments: paymentHistory },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
