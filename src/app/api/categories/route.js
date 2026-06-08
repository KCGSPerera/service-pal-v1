import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';
import { getAuthenticatedUser } from '@/lib/auth';

// GET all active categories
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true'; // Admin view

    const query = includeInactive ? {} : { status: 'active' };
    const categories = await Category.find(query).sort({ category_name: 1 });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ message: 'Server error fetching categories', error: error.message }, { status: 500 });
  }
}

// POST to create a new category (Admin / Super Admin only)
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized. Administrative role required.' }, { status: 401 });
    }

    const body = await request.json();
    const { category_name, category_image } = body;

    if (!category_name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await Category.findOne({ category_name: new RegExp(`^${category_name.trim()}$`, 'i') });
    if (existing) {
      return NextResponse.json({ message: 'Category already exists' }, { status: 400 });
    }

    const newCategory = await Category.create({
      category_name: category_name.trim(),
      category_image: category_image || '',
      status: 'active',
    });

    return NextResponse.json({ message: 'Category created successfully', category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ message: 'Server error creating category', error: error.message }, { status: 500 });
  }
}

// DELETE a category (or toggle inactive status)
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
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }

    // We toggle status to inactive instead of hard deleting to prevent broken references in ads
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();

    // Toggle subcategories as well
    await SubCategory.updateMany({ category_id: id }, { status: category.status });

    return NextResponse.json({ message: `Category status updated to ${category.status}`, category }, { status: 200 });
  } catch (error) {
    console.error('Toggle category error:', error);
    return NextResponse.json({ message: 'Server error changing status', error: error.message }, { status: 500 });
  }
}
