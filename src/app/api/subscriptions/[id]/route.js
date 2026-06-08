import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';
import { sendEmail } from '@/utils/sendEmail';

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    
    if (!tokenUser || (tokenUser.role !== 'super_admin' && tokenUser.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Only Admins can perform this action' }, { status: 403 });
    }

    const { id: subId } = await params;
    const body = await request.json();
    const { action, rejection_reason } = body;

    const subscription = await Subscription.findById(subId).populate('provider_id', 'email first_name last_name');
    if (!subscription) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    if ((action === 'approve' || action === 'reject') && subscription.subscription_status !== 'Pending Approval') {
      return NextResponse.json({ success: false, message: 'Subscription is not pending' }, { status: 400 });
    }
    
    if (action === 'suspend' && subscription.subscription_status !== 'Active') {
      return NextResponse.json({ success: false, message: 'Only active subscriptions can be suspended' }, { status: 400 });
    }

    if (action === 'approve') {
      subscription.subscription_status = 'Active';
      subscription.payment_status = 'Paid';
      
      const isFutureStart = subscription.start_date && new Date(subscription.start_date) > new Date();
      const baseDate = isFutureStart ? new Date(subscription.start_date) : new Date();
      
      if (!isFutureStart) {
        subscription.start_date = baseDate;
      }
      
      const endDate = new Date(baseDate);
      if (subscription.billing_cycle === 'Monthly') endDate.setMonth(endDate.getMonth() + 1);
      else if (subscription.billing_cycle === 'Quarterly') endDate.setMonth(endDate.getMonth() + 3);
      else if (subscription.billing_cycle === 'Yearly') endDate.setFullYear(endDate.getFullYear() + 1);
      
      subscription.end_date = endDate;
      subscription.approved_by = tokenUser.userId;
      subscription.approved_at = new Date();

      // Create Notification
      await Notification.create({
        user_id: subscription.provider_id._id,
        title: 'Subscription Approved',
        message: `Your subscription to ${subscription.plan_name} has been approved.`,
        notification_type: 'SUBSCRIPTION_APPROVED',
      });

      // Send Email
      await sendEmail({
        to: subscription.provider_id.email,
        subject: 'Subscription Approved',
        html: `<p>Hello ${subscription.provider_id.first_name},</p><p>Your subscription plan <strong>${subscription.plan_name}</strong> has been approved successfully.</p><p>You may now access all subscribed features.</p>`,
      });

    } 
    else if (action === 'reject') {
      if (!rejection_reason) {
        return NextResponse.json({ success: false, message: 'Rejection reason is required' }, { status: 400 });
      }
      subscription.subscription_status = 'Rejected';
      subscription.rejection_reason = rejection_reason;
      subscription.approved_by = tokenUser.userId;
      subscription.approved_at = new Date();

      // Create Notification
      await Notification.create({
        user_id: subscription.provider_id._id,
        title: 'Subscription Rejected',
        message: `Your subscription to ${subscription.plan_name} was rejected. Reason: ${rejection_reason}`,
        notification_type: 'SUBSCRIPTION_REJECTED',
      });

      // Send Email
      await sendEmail({
        to: subscription.provider_id.email,
        subject: 'Subscription Request Rejected',
        html: `<p>Hello ${subscription.provider_id.first_name},</p><p>Your subscription request for <strong>${subscription.plan_name}</strong> has been rejected.</p><p>Reason: ${rejection_reason}</p>`,
      });
    }
    else if (action === 'suspend') {
      subscription.subscription_status = 'Suspended';
      
      // Create Notification
      await Notification.create({
        user_id: subscription.provider_id._id,
        title: 'Subscription Suspended',
        message: `Your subscription to ${subscription.plan_name} has been suspended by an administrator.`,
        notification_type: 'SUBSCRIPTION_SUSPENDED',
      });

      // Send Email
      await sendEmail({
        to: subscription.provider_id.email,
        subject: 'Subscription Suspended',
        html: `<p>Hello ${subscription.provider_id.first_name},</p><p>Your subscription plan <strong>${subscription.plan_name}</strong> has been suspended.</p><p>Please contact support for more information.</p>`,
      });
    }
    else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await subscription.save();

    return NextResponse.json({ success: true, message: `Subscription ${action}d successfully` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
