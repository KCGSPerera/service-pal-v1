import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(tokenUser.userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('==== PROFILE UPDATE PAYLOAD ====', Object.keys(body));
    console.log('Body content sample:', JSON.stringify(body).slice(0, 200));
    
    const { 
      phone, 
      profile_image, 
      gender, 
      date_of_birth, 
      familiar_languages, 
      preferred_language, 
      address, 
      city, 
      district 
    } = body;

    // Validate required fields (based on user request)
    if (!phone) {
      return NextResponse.json({ message: 'Contact number is required' }, { status: 400 });
    }
    if (!familiar_languages || !Array.isArray(familiar_languages) || familiar_languages.length === 0) {
      return NextResponse.json({ message: 'At least one familiar language is required' }, { status: 400 });
    }
    if (!preferred_language) {
      return NextResponse.json({ message: 'Preferred language is required' }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ message: 'City is required' }, { status: 400 });
    }
    if (!district) {
      return NextResponse.json({ message: 'District is required' }, { status: 400 });
    }

    // Update fields
    user.phone = phone;
    if (profile_image !== undefined) user.profile_image = profile_image;
    if (gender !== undefined) user.gender = gender;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
    user.familiar_languages = familiar_languages;
    user.preferred_language = preferred_language;
    if (address !== undefined) user.address = address;
    user.city = city;
    user.district = district;

    await user.save();

    const userResponse = {
      _id: user._id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profile_image: user.profile_image,
      auth_provider: user.auth_provider,
      is_profile_completed: user.is_profile_completed,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      familiar_languages: user.familiar_languages,
      preferred_language: user.preferred_language,
      address: user.address,
      city: user.city,
      district: user.district,
    };

    return NextResponse.json(
      { message: 'Profile updated successfully', user: userResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update Profile API error:', error);
    return NextResponse.json(
      { message: 'Server error updating profile', error: error.message },
      { status: 500 }
    );
  }
}
