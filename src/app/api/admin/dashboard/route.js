import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Booking from '@/models/Booking';
import UpgradeRequest from '@/models/UpgradeRequest';
import Category from '@/models/Category';
import ServiceAd from '@/models/ServiceAd';
import Review from '@/models/Review';
import Favorite from '@/models/Favorite';
import ChatMessage from '@/models/ChatMessage';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized. Administrative role required.' }, { status: 401 });
    }

    // 1. Gather stats counts
    const totalUsers = await User.countDocuments();
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalBookings = await Booking.countDocuments();
    const pendingUpgrades = await UpgradeRequest.countDocuments({ status: 'pending' });

    // Calculate revenue (only completed and paid bookings, or completed bookings)
    const completedBookings = await Booking.find({ booking_status: 'completed' });
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.total_amount, 0);

    // New statistics
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ review_status: 'Pending' });
    const approvedReviews = await Review.countDocuments({ review_status: 'Approved' });
    
    const allApprovedReviews = await Review.find({ review_status: 'Approved' });
    const avgProviderRating = allApprovedReviews.length > 0
      ? parseFloat((allApprovedReviews.reduce((sum, r) => sum + r.rating_value, 0) / allApprovedReviews.length).toFixed(1))
      : 0;

    const totalFavorites = await Favorite.countDocuments();
    const totalChatMessages = await ChatMessage.countDocuments();

    // Group chats by sender/receiver pair to count active conversations
    const activeConvsQuery = await ChatMessage.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gt: [{ $toString: '$sender_id' }, { $toString: '$receiver_id' }] },
              { sender: '$sender_id', receiver: '$receiver_id' },
              { sender: '$receiver_id', receiver: '$sender_id' }
            ]
          }
        }
      },
      { $count: 'count' }
    ]);
    const activeConversations = activeConvsQuery.length > 0 ? activeConvsQuery[0].count : 0;

    // 2. Fetch booking distribution by Category
    const allBookings = await Booking.find({})
      .populate({
        path: 'service_ad_id',
        populate: {
          path: 'category_id',
          model: 'Category',
        },
      });

    const categoryDistribution = {};
    allBookings.forEach((b) => {
      if (b.service_ad_id && b.service_ad_id.category_id) {
        const catName = b.service_ad_id.category_id.category_name;
        categoryDistribution[catName] = (categoryDistribution[catName] || 0) + 1;
      }
    });

    // Format for charts
    const bookingsByCategory = Object.entries(categoryDistribution).map(([name, count]) => ({
      name,
      count,
    }));

    // 3. Compile Recent Activities
    const recentBookings = await Booking.find({})
      .populate('customer_id', 'first_name last_name')
      .populate('service_ad_id', 'ad_title')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find({}).select('first_name last_name email role createdAt').sort({ createdAt: -1 }).limit(5);

    const recentUpgrades = await UpgradeRequest.find({})
      .populate('user_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Merge activities with timestamps
    const activities = [];

    recentBookings.forEach((b) => {
      activities.push({
        type: 'booking',
        message: `${b.customer_id ? `${b.customer_id.first_name} ${b.customer_id.last_name}` : 'A customer'} booked "${b.service_ad_id ? b.service_ad_id.ad_title : 'a service'}"`,
        time: b.createdAt,
        status: b.booking_status,
        amount: b.total_amount,
      });
    });

    recentUsers.forEach((u) => {
      activities.push({
        type: 'signup',
        message: `New account registered: ${u.first_name} ${u.last_name} (${u.role})`,
        time: u.createdAt,
      });
    });

    recentUpgrades.forEach((ur) => {
      activities.push({
        type: 'upgrade',
        message: `${ur.user_id ? `${ur.user_id.first_name} ${ur.user_id.last_name}` : 'A seller'} requested upgrade to ${ur.service_type} SP`,
        time: ur.createdAt,
        status: ur.status,
      });
    });

    // Sort combined activities by time desc
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalProviders,
          totalBookings,
          totalRevenue,
          pendingUpgrades,
          totalReviews,
          pendingReviews,
          approvedReviews,
          avgProviderRating,
          totalFavorites,
          totalChatMessages,
          activeConversations,
        },
        bookingsByCategory,
        recentActivities: activities.slice(0, 10),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Super Admin Dashboard API error:', error);
    return NextResponse.json(
      { message: 'Server error retrieving dashboard analytics', error: error.message },
      { status: 500 }
    );
  }
}
