const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// Test Stripe integration by creating a product and price for music distribution
async function testStripeSetup() {
  try {
    console.log('🎵 Testing Stripe setup for music distribution app...\n');

    // Create a product for music distribution services
    const product = await stripe.products.create({
      name: 'Music Distribution Service',
      description: 'Professional music distribution to streaming platforms',
    });

    console.log('✅ Product created successfully!');
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name, '\n');

    // Create a price for the service
    const price = await stripe.prices.create({
      unit_amount: 2999, // $29.99
      currency: 'usd',
      product: product.id,
    });

    console.log('✅ Price created successfully!');
    console.log('Price ID:', price.id);
    console.log('Price Amount:', `$${price.unit_amount / 100}`, '\n');

    // Create a subscription price as well
    const subscriptionPrice = await stripe.prices.create({
      unit_amount: 1299, // $12.99/month
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      product: product.id,
    });

    console.log('✅ Subscription price created successfully!');
    console.log('Subscription Price ID:', subscriptionPrice.id);
    console.log('Subscription Amount:', `$${subscriptionPrice.unit_amount / 100}/month`, '\n');

    console.log('🎉 Stripe setup test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Product ID: ${product.id}`);
    console.log(`- One-time Price ID: ${price.id}`);
    console.log(`- Subscription Price ID: ${subscriptionPrice.id}`);
    console.log('\n💡 You can now use these IDs in your music distribution app!');

  } catch (error) {
    console.error('❌ Error testing Stripe setup:', error.message);
    process.exit(1);
  }
}

testStripeSetup();
