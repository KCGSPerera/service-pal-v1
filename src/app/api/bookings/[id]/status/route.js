import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { booking_status, payment_status } = await request.json();

    const booking = await Booking.findById(id).populate('service_ad_id', 'title');
    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const isCustomer = booking.customer_id.toString() === tokenUser.userId;
    const isProvider = booking.provider_id.toString() === tokenUser.userId;
    const isAdmin = tokenUser.role === 'admin' || tokenUser.role === 'super_admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ message: 'Unauthorized to edit this booking' }, { status: 403 });
    }

    // 1. Handle booking_status transitions
    if (booking_status) {
      const allowedStatus = ['pending', 'accepted', 'declined', 'completed', 'cancelled'];
      if (!allowedStatus.includes(booking_status)) {
        return NextResponse.json({ message: 'Invalid booking status value' }, { status: 400 });
      }

      if (booking_status === 'accepted' || booking_status === 'declined' || booking_status === 'completed') {
        // Only providers or admins can accept, decline, or complete bookings
        if (!isProvider && !isAdmin) {
          return NextResponse.json({ message: 'Only the service provider can accept, decline, or complete a booking.' }, { status: 403 });
        }
      }

      if (booking_status === 'cancelled') {
        // Customer can cancel if pending or accepted. Provider can cancel too.
        if (booking.booking_status === 'completed' || booking.booking_status === 'declined') {
          return NextResponse.json({ message: 'Completed or declined bookings cannot be cancelled.' }, { status: 400 });
        }
      }

      const previousStatus = booking.booking_status;
      booking.booking_status = booking_status;

      // Send notification to customer when provider updates booking status
      if (isProvider || isAdmin) {
        const serviceTitle = booking.service_ad_id?.title || 'your booking';
        let notifMessage = '';
        if (booking_status === 'accepted') {
          notifMessage = `Your booking for "${serviceTitle}" has been accepted by the provider.`;
        } else if (booking_status === 'declined') {
          notifMessage = `Your booking for "${serviceTitle}" has been declined by the provider.`;
        } else if (booking_status === 'completed') {
          notifMessage = `Your booking for "${serviceTitle}" has been marked as completed. You can now leave a review!`;
        }
        if (notifMessage) {
          try {
            await Notification.create({
              user_id: booking.customer_id,
              title: `Booking ${booking_status.charAt(0).toUpperCase() + booking_status.slice(1)}`,
              message: notifMessage,
              notification_type: booking_status === 'declined' ? 'BOOKING_DECLINED' : booking_status === 'completed' ? 'BOOKING_COMPLETED' : 'BOOKING_ACCEPTED',
            });
          } catch (notifErr) {
            console.error('Notification creation error (non-fatal):', notifErr.message);
          }
        }
      }

      // Send notification to provider when customer cancels
      if (isCustomer && booking_status === 'cancelled') {
        const serviceTitle = booking.service_ad_id?.title || 'a booking';
          try {
            await Notification.create({
              user_id: booking.provider_id,
              title: 'Booking Cancelled',
              message: `A customer has cancelled their booking for "${serviceTitle}".`,
              notification_type: 'BOOKING_CANCELLED',
            });
          } catch (notifErr) {
          console.error('Notification creation error (non-fatal):', notifErr.message);
        }
      }
    }

    // 2. Handle payment_status updates
    if (payment_status) {
      const allowedPayments = ['pending', 'paid'];
      if (!allowedPayments.includes(payment_status)) {
        return NextResponse.json({ message: 'Invalid payment status value' }, { status: 400 });
      }

      // Customer, Provider, or Admin can update payment
      booking.payment_status = payment_status;
    }

    await booking.save();

    return NextResponse.json({ message: 'Booking updated successfully', booking }, { status: 200 });
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json({ message: 'Server error updating booking status', error: error.message }, { status: 500 });
  }
}
