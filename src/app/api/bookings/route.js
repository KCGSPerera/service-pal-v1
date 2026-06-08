import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Booking from '@/models/Booking';
import ServiceAd from '@/models/ServiceAd';
import { getAuthenticatedUser } from '@/lib/auth';

// GET bookings list (filtered automatically by customer/provider role)
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = tokenUser;
    const { searchParams } = new URL(request.url);
    const as = searchParams.get('as');

    let query = {};

    if (as === 'provider') {
      query.provider_id = userId;
    } else if (as === 'customer') {
      query.customer_id = userId;
    } else {
      // Legacy role-based fallback
      if (role === 'provider') {
        query.provider_id = userId;
      } else if (role === 'customer') {
        query.customer_id = userId;
      } else if (role === 'admin' || role === 'super_admin') {
        query = {};
      } else {
        return NextResponse.json({ message: 'Invalid role session' }, { status: 403 });
      }
    }

    const bookings = await Booking.find(query)
      .populate('service_ad_id', 'ad_title price_rate pricing_type location_city images')
      .populate('customer_id', 'first_name last_name email phone profile_image')
      .populate('provider_id', 'first_name last_name email phone profile_image')
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ message: 'Server error fetching bookings', error: error.message }, { status: 500 });
  }
}

// POST to create a service booking
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized. Login required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      service_ad_id,
      booking_date,
      booking_time,
      booking_address,
      special_instructions,
      payment_method,
      total_amount,
    } = body;

    // Validate
    if (!service_ad_id || !booking_date || !booking_time || !booking_address || !total_amount) {
      return NextResponse.json({ message: 'Missing required booking fields' }, { status: 400 });
    }

    // Fetch the service ad to find the provider
    const ad = await ServiceAd.findById(service_ad_id);
    if (!ad || ad.status !== 'active') {
      return NextResponse.json({ message: 'Service ad is not active or available' }, { status: 404 });
    }

    // Prevent booking your own service
    if (ad.provider_id.toString() === tokenUser.userId) {
      return NextResponse.json({ message: 'You cannot book your own service ad' }, { status: 400 });
    }

    const newBooking = await Booking.create({
      customer_id: tokenUser.userId,
      provider_id: ad.provider_id,
      service_ad_id,
      booking_date,
      booking_time,
      booking_address,
      special_instructions: special_instructions || '',
      booking_status: 'pending',
      payment_status: 'pending',
      payment_method: payment_method || 'cash',
      total_amount: parseFloat(total_amount),
    });

    return NextResponse.json({ message: 'Booking requested successfully', booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ message: 'Server error creating booking', error: error.message }, { status: 500 });
  }
}
