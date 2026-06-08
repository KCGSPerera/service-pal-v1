import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    
    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ success: false, message: 'Only Service Providers can upgrade subscriptions' }, { status: 403 });
    }

    const { plan_id, upgrade_type } = await request.json();

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan || plan.status !== 'Active') {
      return NextResponse.json({ success: false, message: 'Invalid or inactive subscription plan' }, { status: 400 });
    }

    // Find current active subscription
    const currentSub = await Subscription.findOne({ 
      provider_id: tokenUser.userId,
      subscription_status: { $in: ['Active', 'Pending Approval'] }
    });

    if (!currentSub) {
      return NextResponse.json({ success: false, message: 'No active subscription found to upgrade' }, { status: 400 });
    }

    if (upgrade_type === 'immediate') {
      // Cancel the current active one
      currentSub.subscription_status = 'Cancelled';
      await currentSub.save();

      // Create new one starting immediately (Pending Approval)
      const newSub = await Subscription.create({
        provider_id: tokenUser.userId,
        plan_id: plan._id,
        plan_name: plan.plan_name,
        plan_type: plan.plan_type,
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        featured_ads_limit: plan.featured_ads_limit,
        ad_post_limit: plan.ad_post_limit,
        subscription_status: 'Pending Approval'
      });

      return NextResponse.json({ success: true, message: 'Upgrade requested immediately', data: newSub }, { status: 201 });
      
    } else if (upgrade_type === 'on_renewal') {
      if (currentSub.subscription_status !== 'Active') {
        return NextResponse.json({ success: false, message: 'Cannot queue an upgrade without an active subscription' }, { status: 400 });
      }

      // Create new one starting at current expiration
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
        start_date: currentSub.end_date
      });

      return NextResponse.json({ success: true, message: 'Upgrade queued for renewal date', data: newSub }, { status: 201 });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid upgrade type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Upgrade Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
