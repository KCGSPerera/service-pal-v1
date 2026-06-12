import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ComplaintTicket from '@/models/ComplaintTicket';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List platform complaint tickets
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const personal = searchParams.get('personal') === 'true';

    let query = {};
    // If viewing personal dashboard or if the user is a regular user, restrict to their own tickets.
    if (personal || (tokenUser.role !== 'admin' && tokenUser.role !== 'super_admin')) {
      query.reporter_id = tokenUser.userId;
      if (role) {
        if (role === 'customer') {
          query.$or = [
            { reporter_role: 'customer' },
            { reporter_role: { $exists: false } },
            { reporter_role: null }
          ];
        } else {
          query.reporter_role = role;
        }
      }
    } else {
      // Admin ticket desk
      if (role) {
        if (role === 'customer') {
          query.$or = [
            { reporter_role: 'customer' },
            { reporter_role: { $exists: false } },
            { reporter_role: null }
          ];
        } else {
          query.reporter_role = role;
        }
      }
    }

    const tickets = await ComplaintTicket.find(query)
      .populate('reporter_id', 'first_name last_name email role')
      .populate('replies.sender_id', 'first_name last_name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tickets }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new complaint ticket
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const { title, subtitle, description, references, reporter_role } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, message: 'Description is required' }, { status: 400 });
    }

    const newTicket = await ComplaintTicket.create({
      reporter_id: tokenUser.userId,
      reporter_role: reporter_role || 'customer',
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      description: description.trim(),
      references: Array.isArray(references) ? references : [],
      status: 'Open',
    });

    // Populate user info for immediate use on client
    const populatedTicket = await ComplaintTicket.findById(newTicket._id)
      .populate('reporter_id', 'first_name last_name email role');

    return NextResponse.json({ success: true, message: 'Ticket raised successfully', data: populatedTicket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
