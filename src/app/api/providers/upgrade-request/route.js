import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UpgradeRequest from '@/models/UpgradeRequest';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      // Legacy fields
      business_name,
      description,
      category_id,
      sub_category_id,
      address,
      city,
      postal_code,
      service_type, // 'Individual' or 'Corporate'

      // New Common Fields
      profile_photo,
      whatsapp_number,
      website,
      facebook_link,
      instagram_link,
      service_expertise,
      warranty,
      working_cities,

      // Legacy Optional
      business_email,
      business_phone,
      billing_proof_image,
      working_hours,
      working_days,
      police_report_image,

      // Individual Specific
      years_of_experience,
      nic_number,
      business_card,
      nic_front_image,
      nic_back_image,

      // Corporate Specific
      business_type,
      years_in_industry,
      business_document,
      business_registration_number,
      
      // Legacy Corporate Optional
      owner_name,
      owner_nic,
      owner_nic_front,
      owner_nic_back,
      br_document,
      tax_id,
    } = body;

    // Basic Validation
    if (!profile_photo || !service_type || !category_id) {
      return NextResponse.json(
        { message: 'Missing mandatory common fields (profile photo, service type, or category)' },
        { status: 400 }
      );
    }

    // Check if there is already a pending upgrade request for this user
    const existingPending = await UpgradeRequest.findOne({
      user_id: tokenUser.userId,
      status: 'pending',
    });

    if (existingPending) {
      return NextResponse.json(
        { message: 'You already have a pending upgrade request. Please wait for admin approval.' },
        { status: 400 }
      );
    }

    // Build fields based on service type
    const requestData = {
      user_id: tokenUser.userId,
      profile_photo,
      whatsapp_number: whatsapp_number || '',
      website_link: website || '',
      facebook_link: facebook_link || '',
      instagram_link: instagram_link || '',
      category_id,
      sub_category_id: sub_category_id || category_id, // fallback
      service_expertise: Array.isArray(service_expertise) ? service_expertise : (service_expertise ? service_expertise.split(',').map(s => s.trim()) : []),
      warranty: warranty || '',
      working_cities: Array.isArray(working_cities) ? working_cities : (working_cities ? working_cities.split(',').map(s => s.trim()) : []),
      service_type,
      status: 'pending',
      
      // Legacy Mappings
      business_name: business_name || '',
      business_email: business_email || '',
      business_phone: business_phone || '',
      description: description || '',
      address: address || '',
      city: city || '',
      postal_code: postal_code || '',
      billing_proof_image: billing_proof_image || '',
      working_hours: working_hours || '',
      working_days: working_days || [],
    };

    if (service_type === 'Individual') {
      if (years_of_experience === undefined || !nic_number) {
        return NextResponse.json({ message: 'Years of experience and NIC number are required for Individual upgrade' }, { status: 400 });
      }
      requestData.years_of_experience = years_of_experience;
      requestData.nic_number = nic_number;
      requestData.business_card = business_card || '';
      
      // Legacy optional for individual
      requestData.police_report_image = police_report_image || '';
      requestData.nic_front_image = nic_front_image || '';
      requestData.nic_back_image = nic_back_image || '';
      
    } else if (service_type === 'Corporate') {
      if (!business_name || !business_type || years_in_industry === undefined || !business_registration_number || !business_document) {
        return NextResponse.json({ message: 'Business name, type, years in industry, BR number, and BR document are required for Corporate upgrade' }, { status: 400 });
      }
      requestData.business_name = business_name;
      requestData.business_type = business_type;
      requestData.years_in_industry = years_in_industry;
      requestData.business_registration_number = business_registration_number;
      requestData.business_document = business_document;
      
      // Legacy optional for corporate
      requestData.registration_number = business_registration_number; // map for backward compat
      requestData.registration_document = business_document; // map for backward compat
      requestData.owner_name = owner_name || '';
      requestData.owner_nic = owner_nic || '';
      requestData.owner_nic_front = owner_nic_front || '';
      requestData.owner_nic_back = owner_nic_back || '';
      requestData.br_document = br_document || '';
      requestData.tax_id = tax_id || '';
    } else {
      return NextResponse.json({ message: 'Invalid service type' }, { status: 400 });
    }

    // Check if there is an existing rejected request
    const existingRejected = await UpgradeRequest.findOne({
      user_id: tokenUser.userId,
      status: 'rejected',
    });

    let upgradeRequest;
    if (existingRejected) {
      // Overwrite existing rejected request
      Object.assign(existingRejected, requestData);
      existingRejected.status = 'pending';
      existingRejected.admin_remarks = '';
      existingRejected.rejection_reason = '';
      upgradeRequest = await existingRejected.save();
    } else {
      upgradeRequest = await UpgradeRequest.create(requestData);
    }

    return NextResponse.json(
      {
        message: existingRejected ? 'Upgrade request resubmitted successfully. Awaiting administrator review.' : 'Upgrade request submitted successfully. Awaiting administrator review.',
        requestId: upgradeRequest._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upgrade request error:', error);
    return NextResponse.json(
      { message: 'Server error submitting upgrade request', error: error.message },
      { status: 500 }
    );
  }
}

// GET active user's upgrade requests status
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const upgradeRequests = await UpgradeRequest.find({ user_id: tokenUser.userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      { upgradeRequests },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch user upgrade requests error:', error);
    return NextResponse.json(
      { message: 'Server error fetching requests', error: error.message },
      { status: 500 }
    );
  }
}
