import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    
    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Only Super Admins can perform this action' }, { status: 403 });
    }

    const { id: planId } = await params;
    const body = await request.json();

    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(planId, body, { new: true, runValidators: true });
    
    if (!updatedPlan) {
      return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Subscription plan updated successfully', data: updatedPlan }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const PUT = PATCH;

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    
    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Only Super Admins can perform this action' }, { status: 403 });
    }

    const { id: planId } = await params;
    const plan = await SubscriptionPlan.findById(planId);
    
    if (!plan) {
      return NextResponse.json({ success: false, message: 'Plan not found' }, { status: 404 });
    }
    
    // Instead of hard delete, maybe just mark as inactive, or we can hard delete if no active subscriptions exist
    // For simplicity, we just delete
    await SubscriptionPlan.findByIdAndDelete(planId);

    return NextResponse.json({ success: true, message: 'Subscription plan deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
