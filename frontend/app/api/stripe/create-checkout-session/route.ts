// NOT USING MANUAL API CALL RIGHT NOW. USING PAYMENT LINK INSTEAD IN /payment/page.tsx

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { product_id } = await req.json();

  if (!product_id) {
    return NextResponse.json(
      { error: "No product_id provided." },
      { status: 400 }
    );
  }

  try {
    // Get the product to find its default price
    const product = await stripe.products.retrieve(product_id);

    if (!product.default_price) {
      return NextResponse.json(
        { error: "Product has no default price configured." },
        { status: 400 }
      );
    }

    // Determine the base URL based on environment
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_DEV_APP_URL || "http://localhost:3000"
        : process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      line_items: [
        {
          price: product.default_price as string,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard`,
      cancel_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
