import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import UpgradeRequest from '@/models/UpgradeRequest';
import PortfolioItem from '@/models/PortfolioItem';
import Review from '@/models/Review';
import { getAuthenticatedUser } from '@/lib/auth';

// GET provider profile. Can be current logged in provider or public request for a specific provider (?providerId=xxx)
export async function GET(request) {
  try {
    await dbConnect();
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    let providerId = searchParams.get('providerId');

    if (!providerId) {
      // If no providerId provided, assume they want the current logged in provider profile
      const tokenUser = await getAuthenticatedUser(request);
      if (!tokenUser || tokenUser.role !== 'provider') {
        return NextResponse.json(
          { message: 'Unauthorized or not a provider' },
          { status: 401 }
        );
      }
      providerId = tokenUser.userId;
    }

    // 1. Fetch User details
    const providerUser = await User.findById(providerId).select('-password');
    if (!providerUser || (providerUser.role !== 'provider' && providerUser.role !== 'super_admin')) {
      return NextResponse.json(
        { message: 'Provider not found' },
        { status: 404 }
      );
    }

    // 2. Fetch Business details (from approved UpgradeRequest)
    const upgradeInfo = await UpgradeRequest.findOne({
      user_id: providerId,
      status: 'approved',
    });

    // 3. Fetch Portfolio
    const portfolio = await PortfolioItem.find({ provider_id: providerId }).sort({ createdAt: -1 });

    // 4. Fetch Reviews and calculate Average Rating
    const reviews = await Review.find({ provider_id: providerId })
      .populate('customer_id', 'first_name last_name profile_image')
      .sort({ createdAt: -1 });
      
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? Number((reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews).toFixed(1)) 
      : 0;

    return NextResponse.json(
      {
        provider: providerUser,
        businessInfo: upgradeInfo || null,
        portfolio,
        reviews,
        averageRating,
        totalReviews,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch provider profile error:', error);
    return NextResponse.json(
      { message: 'Server error retrieving profile', error: error.message },
      { status: 500 }
    );
  }
}

// PUT to edit provider profile (updates active approved UpgradeRequest details and User table details)
export async function PUT(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json(
        { message: 'Unauthorized. Provider access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      phone,
      gender,
      profile_image,
      // Business fields
      business_name,
      business_phone,
      description,
      address,
      city,
      postal_code,
      working_hours,
      working_days,
      logo,
      facebook_link,
      instagram_link,
      linkedin_link,
      website_link,
    } = body;

    // 1. Update core user details
    const user = await User.findById(tokenUser.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (profile_image) user.profile_image = profile_image;
    await user.save();

    // 2. Update approved UpgradeRequest
    const upgradeReq = await UpgradeRequest.findOne({
      user_id: tokenUser.userId,
      status: 'approved',
    });

    if (upgradeReq) {
      if (business_name) upgradeReq.business_name = business_name;
      if (business_phone) upgradeReq.business_phone = business_phone;
      if (description) upgradeReq.description = description;
      if (address) upgradeReq.address = address;
      if (city) upgradeReq.city = city;
      if (postal_code) upgradeReq.postal_code = postal_code;
      if (working_hours) upgradeReq.working_hours = working_hours;
      if (working_days) upgradeReq.working_days = working_days;
      if (logo) upgradeReq.logo = logo;
      if (facebook_link !== undefined) upgradeReq.facebook_link = facebook_link;
      if (instagram_link !== undefined) upgradeReq.instagram_link = instagram_link;
      if (linkedin_link !== undefined) upgradeReq.linkedin_link = linkedin_link;
      if (website_link !== undefined) upgradeReq.website_link = website_link;
      await upgradeReq.save();
    }

    return NextResponse.json(
      { message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update provider profile error:', error);
    return NextResponse.json(
      { message: 'Server error updating profile', error: error.message },
      { status: 500 }
    );
  }
}
