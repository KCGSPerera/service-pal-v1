import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UpgradeRequest from '@/models/UpgradeRequest';
import Notification from '@/models/Notification';
import { sendMail } from '@/lib/email'; // optional notification email

import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // upgrade request ID from URL
    const { action, admin_remarks } = await request.json();

    const tokenUser = await getAuthenticatedUser(request);

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Use "approved" or "rejected".' }, { status: 400 });
    }

    const upgrade = await UpgradeRequest.findById(id);
    if (!upgrade) {
      return NextResponse.json({ message: 'Upgrade request not found' }, { status: 404 });
    }

    // Update status and admin remarks
    upgrade.status = action;
    upgrade.admin_remarks = admin_remarks || '';
    upgrade.rejection_reason = admin_remarks || '';
    if (tokenUser && tokenUser.userId) {
      upgrade.reviewed_by = tokenUser.userId;
    }
    if (action === 'approved') {
      upgrade.approval_date = new Date();
    }
    await upgrade.save();

    // If approved, update user's role to 'provider'
    if (action === 'approved' && upgrade.user_id) {
      const User = require('@/models/User').default || require('@/models/User');
      await User.findByIdAndUpdate(upgrade.user_id, { role: 'provider' });
    }

    // Notification and Email Logic
    try {
      const emailSubject = `Your Service-Pal upgrade request has been ${action}`;
      let emailHtml = `<p>Dear User,</p>
        <p>Your upgrade request for <strong>${upgrade.business_name || 'Service Provider'}</strong> has been <strong>${action}</strong>.</p>
        <p>Remarks: ${upgrade.admin_remarks || 'None'}</p>`;
      
      let notificationMessage = `Your upgrade request has been ${action}.`;

      if (action === 'rejected') {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resubmitUrl = `${appUrl}/`;
        
        emailHtml += `<p>Please correct the issues mentioned above and click the link below to resubmit your application:</p>
          <a href="${resubmitUrl}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Resubmit Application</a>`;
        
        notificationMessage = `Your upgrade request was rejected. Reason: ${upgrade.admin_remarks}. Please click "Become a Seller" to review and resubmit.`;
      } else {
        notificationMessage = `Congratulations! Your request to become a Service Provider has been approved.`;
      }

      // Create in-app notification
      if (upgrade.user_id) {
        await Notification.create({
          user_id: upgrade.user_id,
          title: `Upgrade Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          message: notificationMessage,
          notification_type: action === 'approved' ? 'UPGRADE_APPROVED' : 'UPGRADE_REJECTED',
        });
      }

      // Send email if business email or user email is available
      const targetEmail = upgrade.business_email || (upgrade.user_id && upgrade.user_id.email);
      if (targetEmail) {
        await sendMail(targetEmail, emailSubject, emailHtml);
      }
    } catch (e) {
      console.error('Failed to send upgrade decision email/notification:', e);
    }

    return NextResponse.json({ message: `Upgrade request ${action} successfully` }, { status: 200 });
  } catch (error) {
    console.error('Admin upgrade action error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
