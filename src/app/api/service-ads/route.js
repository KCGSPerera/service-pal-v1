import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ServiceAd from '@/models/ServiceAd';
import User from '@/models/User';
import Review from '@/models/Review';
import UpgradeRequest from '@/models/UpgradeRequest';
import { getAuthenticatedUser } from '@/lib/auth';

// GET list of service ads with search and filters
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // Search query parameters
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'latest';
    const providerId = searchParams.get('providerId');

    // Build Mongoose Query
    const query = { status: 'active' };

    if (providerId) {
      query.provider_id = providerId;
    }

    if (category) {
      query.category_id = category;
    }

    if (subcategory) {
      query.sub_category_id = subcategory;
    }

    if (city) {
      query.location_city = new RegExp(`^${city.trim()}$`, 'i');
    }

    // Keyword search
    if (q) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { ad_title: regex },
        { ad_description: regex },
        { tags: { $in: [regex] } },
      ];
    }

    // Price filtering
    if (minPrice || maxPrice) {
      query.price_rate = {};
      if (minPrice) query.price_rate.$gte = parseFloat(minPrice);
      if (maxPrice) query.price_rate.$lte = parseFloat(maxPrice);
    }

    // Determine Sort Options
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price_asc') {
      sortOptions = { price_rate: 1 };
    } else if (sortBy === 'price_desc') {
      sortOptions = { price_rate: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    // Execute query
    let ads = await ServiceAd.find(query)
      .populate('category_id', 'category_name')
      .populate('sub_category_id', 'sub_category_name')
      .populate('provider_id', 'first_name last_name profile_image phone email')
      .sort(sortOptions);

    // For each ad, fetch provider details from approved UpgradeRequest and rating info
    const enrichedAds = await Promise.all(
      ads.map(async (ad) => {
        const adObj = ad.toObject();
        
        // 1. Fetch business logo, description and other details from active upgrade
        if (ad.provider_id) {
          const businessInfo = await UpgradeRequest.findOne({
            user_id: ad.provider_id._id,
            status: 'approved',
          });
          adObj.businessInfo = businessInfo || null;

          // 2. Fetch rating reviews
          const reviews = await Review.find({ provider_id: ad.provider_id._id });
          const totalReviews = reviews.length;
          const averageRating = totalReviews > 0
            ? Number((reviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews).toFixed(1))
            : 0;

          adObj.averageRating = averageRating;
          adObj.totalReviews = totalReviews;
        } else {
          adObj.businessInfo = null;
          adObj.averageRating = 0;
          adObj.totalReviews = 0;
        }

        return adObj;
      })
    );

    // Manual Sort by Rating if requested
    if (sortBy === 'rating_desc') {
      enrichedAds.sort((a, b) => b.averageRating - a.averageRating);
    }

    return NextResponse.json({ ads: enrichedAds }, { status: 200 });
  } catch (error) {
    console.error('Fetch service ads error:', error);
    return NextResponse.json({ message: 'Server error retrieving service ads', error: error.message }, { status: 500 });
  }
}

// POST to create a service ad (Provider only)
export async function POST(request) {
  try {
    await dbConnect();
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
      tags,
    } = body;

    // Validate
    if (
      !ad_title ||
      !ad_description ||
      !category_id ||
      !sub_category_id ||
      !price_rate ||
      !pricing_type ||
      !location_city ||
      !availability_hours ||
      !availability_days || availability_days.length === 0
    ) {
      return NextResponse.json({ message: 'Missing required service ad fields' }, { status: 400 });
    }

    const newAd = await ServiceAd.create({
      provider_id: tokenUser.userId,
      ad_title,
      ad_description,
      category_id,
      sub_category_id,
      price_rate: parseFloat(price_rate),
      pricing_type,
      images: images || [],
      location_city,
      availability_days,
      availability_hours,
      tags: tags || [],
      status: 'active',
    });

    return NextResponse.json({ message: 'Service ad created successfully', ad: newAd }, { status: 201 });
  } catch (error) {
    console.error('Create service ad error:', error);
    return NextResponse.json({ message: 'Server error creating service ad', error: error.message }, { status: 500 });
  }
}
