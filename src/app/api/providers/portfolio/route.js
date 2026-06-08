import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PortfolioItem from '@/models/PortfolioItem';
import { getAuthenticatedUser } from '@/lib/auth';

// GET all portfolio items of the logged in provider, or a specific providerId
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    let providerId = searchParams.get('providerId');

    if (!providerId) {
      const tokenUser = await getAuthenticatedUser(request);
      if (!tokenUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      providerId = tokenUser.userId;
    }

    const items = await PortfolioItem.find({ provider_id: providerId }).sort({ createdAt: -1 });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Fetch portfolio error:', error);
    return NextResponse.json({ message: 'Server error fetching portfolio', error: error.message }, { status: 500 });
  }
}

// POST to create a new portfolio item
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ message: 'Unauthorized. Provider role required.' }, { status: 401 });
    }

    const body = await request.json();
    const { project_title, project_description, project_images, project_link, completion_date } = body;

    if (!project_title || !project_description) {
      return NextResponse.json({ message: 'Title and description are required' }, { status: 400 });
    }

    const newItem = await PortfolioItem.create({
      provider_id: tokenUser.userId,
      project_title,
      project_description,
      project_images: project_images || [],
      project_link: project_link || '',
      completion_date: completion_date ? new Date(completion_date) : null,
    });

    return NextResponse.json({ message: 'Portfolio item added successfully', item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Create portfolio error:', error);
    return NextResponse.json({ message: 'Server error adding portfolio item', error: error.message }, { status: 500 });
  }
}

// DELETE a portfolio item
export async function DELETE(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Portfolio item ID is required' }, { status: 400 });
    }

    const deletedItem = await PortfolioItem.findOneAndDelete({
      _id: id,
      provider_id: tokenUser.userId,
    });

    if (!deletedItem) {
      return NextResponse.json({ message: 'Portfolio item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Portfolio item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    return NextResponse.json({ message: 'Server error deleting portfolio item', error: error.message }, { status: 500 });
  }
}

// PUT to edit a portfolio item
export async function PUT(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'provider') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, project_title, project_description, project_images, project_link, completion_date } = body;

    if (!id || !project_title || !project_description) {
      return NextResponse.json({ message: 'ID, title, and description are required' }, { status: 400 });
    }

    const updatedItem = await PortfolioItem.findOneAndUpdate(
      { _id: id, provider_id: tokenUser.userId },
      {
        project_title,
        project_description,
        project_images: project_images || [],
        project_link: project_link || '',
        completion_date: completion_date ? new Date(completion_date) : null,
      },
      { new: true }
    );

    if (!updatedItem) {
      return NextResponse.json({ message: 'Portfolio item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Portfolio item updated successfully', item: updatedItem }, { status: 200 });
  } catch (error) {
    console.error('Update portfolio error:', error);
    return NextResponse.json({ message: 'Server error updating portfolio item', error: error.message }, { status: 500 });
  }
}
