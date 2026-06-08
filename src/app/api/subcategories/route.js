import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubCategory from '@/models/SubCategory';
import { getAuthenticatedUser } from '@/lib/auth';

// GET active subcategories (can filter by categoryId)
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const includeInactive = searchParams.get('all') === 'true'; // Admin view

    const query = includeInactive ? {} : { status: 'active' };
    if (categoryId) {
      query.category_id = categoryId;
    }

    const subcategories = await SubCategory.find(query).populate('category_id', 'category_name').sort({ sub_category_name: 1 });

    return NextResponse.json({ subcategories }, { status: 200 });
  } catch (error) {
    console.error('Fetch subcategories error:', error);
    return NextResponse.json({ message: 'Server error fetching subcategories', error: error.message }, { status: 500 });
  }
}

// POST to create a subcategory (Admin only)
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized. Administrative role required.' }, { status: 401 });
    }

    const body = await request.json();
    const { sub_category_name, category_id } = body;

    if (!sub_category_name || !category_id) {
      return NextResponse.json({ message: 'Subcategory name and parent Category ID are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await SubCategory.findOne({
      sub_category_name: new RegExp(`^${sub_category_name.trim()}$`, 'i'),
      category_id,
    });

    if (existing) {
      return NextResponse.json({ message: 'Subcategory already exists in this category' }, { status: 400 });
    }

    const newSub = await SubCategory.create({
      sub_category_name: sub_category_name.trim(),
      category_id,
      status: 'active',
    });

    return NextResponse.json({ message: 'Subcategory created successfully', subcategory: newSub }, { status: 201 });
  } catch (error) {
    console.error('Create subcategory error:', error);
    return NextResponse.json({ message: 'Server error creating subcategory', error: error.message }, { status: 500 });
  }
}

// DELETE to toggle active status (Admin only)
export async function DELETE(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Subcategory ID is required' }, { status: 400 });
    }

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return NextResponse.json({ message: 'Subcategory not found' }, { status: 404 });
    }

    subcategory.status = subcategory.status === 'active' ? 'inactive' : 'active';
    await subcategory.save();

    return NextResponse.json({ message: `Subcategory status updated to ${subcategory.status}`, subcategory }, { status: 200 });
  } catch (error) {
    console.error('Toggle subcategory error:', error);
    return NextResponse.json({ message: 'Server error changing status', error: error.message }, { status: 500 });
  }
}
