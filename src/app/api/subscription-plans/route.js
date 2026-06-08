import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all subscription plans
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = {};
    if (status) query.status = status;

    const plans = await SubscriptionPlan.find(query)
      .populate('created_by', 'first_name last_name')
      .sort({ price: 1 });

    return NextResponse.json({ success: true, data: plans }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new subscription plan
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ message: 'Only Super Admins can create subscription plans' }, { status: 403 });
    }

    const body = await request.json();
    const { plan_name, plan_type, price, billing_cycle, featured_ads_limit, ad_post_limit, description } = body;

    if (!plan_name || !plan_type || price === undefined || !billing_cycle || featured_ads_limit === undefined || ad_post_limit === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const newPlan = await SubscriptionPlan.create({
      plan_name,
      plan_type,
      price,
      billing_cycle,
      featured_ads_limit,
      ad_post_limit,
      description: description || '',
      created_by: tokenUser.userId,
    });

    return NextResponse.json({ success: true, message: 'Subscription plan created successfully', data: newPlan }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
