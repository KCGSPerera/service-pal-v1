import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ServiceAd from '@/models/ServiceAd';
import UpgradeRequest from '@/models/UpgradeRequest';
import Review from '@/models/Review';
import { getAuthenticatedUser } from '@/lib/auth';

// GET a single service ad by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const ad = await ServiceAd.findById(id)
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .populate('provider_id', 'first_name last_name profile_image phone email');

    if (!ad || ad.status === 'deleted') {
      return NextResponse.json({ message: 'Service ad not found' }, { status: 404 });
    }

    const adObj = ad.toObject();

    // Fetch provider business info
    if (ad.provider_id) {
      const businessInfo = await UpgradeRequest.findOne({
        user_id: ad.provider_id._id,
        status: 'approved',
      });
      adObj.businessInfo = businessInfo || null;

      // Fetch reviews
      const reviews = await Review.find({ provider_id: ad.provider_id._id, review_status: 'Approved' })
        .populate('user_id', 'first_name last_name profile_image')
        .sort({ createdAt: -1 });

      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? Number((reviews.reduce((sum, rev) => sum + rev.rating_value, 0) / totalReviews).toFixed(1))
        : 0;

      adObj.reviews = reviews;
      adObj.averageRating = averageRating;
      adObj.totalReviews = totalReviews;
    }

    return NextResponse.json({ ad: adObj }, { status: 200 });
  } catch (error) {
    console.error('Fetch service ad detail error:', error);
    return NextResponse.json({ message: 'Server error retrieving ad details', error: error.message }, { status: 500 });
  }
}

// PUT to update a service ad
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ message: 'Unauthorized. Provider status required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ad_title,
      ad_description,
      category_id,
      sub_category_id,
      price_rate,
      pricing_type,
      images,
      location_city,
      availability_days,
      availability_hours,
      status, // active, paused
      tags,
    } = body;

    const ad = await ServiceAd.findOne({ _id: id, provider_id: tokenUser.userId });

    if (!ad || ad.status === 'deleted') {
      return NextResponse.json({ message: 'Service ad not found or unauthorized' }, { status: 404 });
    }

    // Update fields if provided
    if (ad_title) ad.ad_title = ad_title;
    if (ad_description) ad.ad_description = ad_description;
    if (category_id) ad.category_id = category_id;
    if (sub_category_id) ad.sub_category_id = sub_category_id;
    if (price_rate) ad.price_rate = parseFloat(price_rate);
    if (pricing_type) ad.pricing_type = pricing_type;
    if (images) ad.images = images;
    if (location_city) ad.location_city = location_city;
    if (availability_days) ad.availability_days = availability_days;
    if (availability_hours) ad.availability_hours = availability_hours;
    if (status) ad.status = status;
    if (tags) ad.tags = tags;

    await ad.save();

    return NextResponse.json({ message: 'Service ad updated successfully', ad }, { status: 200 });
  } catch (error) {
    console.error('Update service ad error:', error);
    return NextResponse.json({ message: 'Server error updating service ad', error: error.message }, { status: 500 });
  }
}

// DELETE (soft delete) a service ad
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const tokenUser = await getAuthenticatedUser(request);
    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const ad = await ServiceAd.findOne({ _id: id, provider_id: tokenUser.userId });

    if (!ad) {
      return NextResponse.json({ message: 'Service ad not found or unauthorized' }, { status: 404 });
    }

    ad.status = 'deleted';
    await ad.save();

    return NextResponse.json({ message: 'Service ad deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete service ad error:', error);
    return NextResponse.json({ message: 'Server error deleting service ad', error: error.message }, { status: 500 });
  }
}
