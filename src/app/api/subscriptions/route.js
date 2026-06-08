import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all subscriptions
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const providerOnly = searchParams.get('provider');

    let query = {};
    if (status === 'Inactive') {
      query.subscription_status = { $in: ['Expired', 'Suspended', 'Cancelled', 'Rejected'] };
    } else if (status) {
      query.subscription_status = status;
    }
    
    // If the user is a provider, they can only see their own subscriptions
    if (tokenUser.role === 'provider' || providerOnly) {
      query.provider_id = tokenUser.userId;
    } else if (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    const subscriptions = await Subscription.find(query)
      .populate('provider_id', 'first_name last_name email')
      .populate('approved_by', 'first_name last_name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: subscriptions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Request a new subscription
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ message: 'Only providers can request subscriptions' }, { status: 403 });
    }

    const { plan_id } = await request.json();

    if (!plan_id) {
      return NextResponse.json({ success: false, message: 'plan_id is required' }, { status: 400 });
    }

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan || plan.status !== 'Active') {
      return NextResponse.json({ success: false, message: 'Invalid or inactive subscription plan' }, { status: 400 });
    }

    // Check if provider already has an active or pending subscription
    const existing = await Subscription.findOne({
      provider_id: tokenUser.userId,
      subscription_status: { $in: ['Active', 'Pending Approval'] }
    });

    if (existing) {
      return NextResponse.json({ success: false, message: `You already have a ${existing.subscription_status} subscription` }, { status: 400 });
    }

    const newSub = await Subscription.create({
      provider_id: tokenUser.userId,
      plan_id: plan._id,
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      featured_ads_limit: plan.featured_ads_limit,
      ad_post_limit: plan.ad_post_limit,
      subscription_status: 'Pending Approval',
      payment_status: 'Pending',
    });

    return NextResponse.json({ success: true, message: 'Subscription requested successfully', data: newSub }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
