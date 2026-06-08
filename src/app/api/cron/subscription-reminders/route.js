import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import Notification from '@/models/Notification';
import { sendEmail } from '@/utils/sendEmail';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Auth check for cron jobs usually involves a secret header.
    // We are skipping it here for easy manual testing, but in production:
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeSubscriptions = await Subscription.find({ subscription_status: 'Active' })
      .populate('provider_id', 'email first_name last_name _id');

    const now = new Date();
    let remindersSent = 0;

    for (const sub of activeSubscriptions) {
      if (!sub.end_date) continue;

      const diffTime = sub.end_date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let reminderType = null;
      if (diffDays === 7) {
        reminderType = '1 week';
      } else if (diffDays === 1) {
        reminderType = '1 day';
      }

      if (reminderType) {
        const title = `Subscription Renewal Reminder`;
        const message = `Your subscription for ${sub.plan_name} is set to expire in ${reminderType} (${new Date(sub.end_date).toLocaleDateString()}). Please renew or upgrade your plan to avoid service interruption.`;

        // Send In-App Notification
        await Notification.create({
          user_id: sub.provider_id._id,
          title: title,
          message: message,
          notification_type: 'SUBSCRIPTION_REMINDER',
        });

        // Send Email
        await sendEmail({
          to: sub.provider_id.email,
          subject: title,
          html: `<p>Dear ${sub.provider_id.first_name},</p><p>${message}</p>`,
        });

        remindersSent++;
      }
    }

    return NextResponse.json({ success: true, message: `Processed ${activeSubscriptions.length} subscriptions. Sent ${remindersSent} reminders.` }, { status: 200 });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
