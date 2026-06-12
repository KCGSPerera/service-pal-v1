import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ComplaintOption from '@/models/ComplaintOption';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Retrieve all complaint options
export async function GET(request) {
  try {
    await dbConnect();
    const options = await ComplaintOption.find({})
      .populate('associated_titles', 'value')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: options }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new complaint option (Super Admin only)
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { type, value, associated_titles } = await request.json();

    if (!type || !value) {
      return NextResponse.json({ success: false, message: 'Type and Value are required' }, { status: 400 });
    }

    if (!['title', 'subtitle'].includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid type. Must be title or subtitle' }, { status: 400 });
    }

    // Check if duplicate exists
    const existing = await ComplaintOption.findOne({ type, value: value.trim() });
    if (existing) {
      return NextResponse.json({ success: false, message: `This ${type} option already exists` }, { status: 400 });
    }

    const newOption = await ComplaintOption.create({
      type,
      value: value.trim(),
      associated_titles: type === 'subtitle' && Array.isArray(associated_titles) ? associated_titles : [],
    });

    const populatedOption = await ComplaintOption.findById(newOption._id)
      .populate('associated_titles', 'value');

    return NextResponse.json({ success: true, message: 'Option created successfully', data: populatedOption }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
