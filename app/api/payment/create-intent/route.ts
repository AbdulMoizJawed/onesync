import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, email, name, beatId, beatTitle, paymentMethodData } = await req.json()

    if (!amount || !beatId || !email || !paymentMethodData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("🔹 Creating payment method...")

    // ✅ Step 1: Create Payment Method from raw card data
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: paymentMethodData,
      billing_details: { name, email },
    })

    console.log("✅ Payment method created:", paymentMethod.id)

    // ✅ Step 2: Create & Confirm Payment Intent (server-side)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // cents
      currency: currency || "usd",
      payment_method_types: ["card"], // ✅ required when disabling auto payment methods
      payment_method: paymentMethod.id,
      confirm: true, // directly confirm
      receipt_email: email,
      description: `Beat: ${beatTitle}`,
      metadata: {
        beatId,
        beatTitle,
        email,
      },
    })

    console.log("✅ Payment intent confirmed:", paymentIntent.id, "Status:", paymentIntent.status)

    if (paymentIntent.status === "succeeded") {
      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      })
    }

    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
    })
  } catch (error: any) {
    console.error("❌ Stripe error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
