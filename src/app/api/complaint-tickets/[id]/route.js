import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ComplaintTicket from '@/models/ComplaintTicket';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Retrieve single ticket details
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const { id } = await params;
    const ticket = await ComplaintTicket.findById(id)
      .populate('reporter_id', 'first_name last_name email role')
      .populate('replies.sender_id', 'first_name last_name email role');

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    // Authorization check: User must be admin/super_admin OR the original reporter
    const isAdmin = tokenUser.role === 'admin' || tokenUser.role === 'super_admin';
    const isReporter = ticket.reporter_id._id.toString() === tokenUser.userId;

    if (!isAdmin && !isReporter) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: ticket }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH: Perform actions on a ticket (reply, admin_close, user_complete)
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const { id } = await params;
    const ticket = await ComplaintTicket.findById(id);

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    const isAdmin = tokenUser.role === 'admin' || tokenUser.role === 'super_admin';
    const isReporter = ticket.reporter_id.toString() === tokenUser.userId;

    if (!isAdmin && !isReporter) {
      return NextResponse.json({ success: false, message: 'Forbidden: Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, message: 'Action is required' }, { status: 400 });
    }

    if (action === 'reply') {
      const { message } = body;
      if (!message || !message.trim()) {
        return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
      }

      ticket.replies.push({
        sender_id: tokenUser.userId,
        sender_role: tokenUser.role,
        message: message.trim(),
        sent_at: new Date(),
      });
    } 
    else if (action === 'admin_close') {
      if (!isAdmin) {
        return NextResponse.json({ success: false, message: 'Only administrators can perform this action' }, { status: 403 });
      }

      ticket.closed_by_admin = true;
      ticket.admin_marked_closed_at = new Date();

      if (ticket.closed_by_user) {
        ticket.status = 'Closed';
      }
    } 
    else if (action === 'user_complete') {
      if (!isReporter) {
        return NextResponse.json({ success: false, message: 'Only the ticket reporter can confirm resolution' }, { status: 403 });
      }

      ticket.closed_by_user = true;
      ticket.user_marked_completed_at = new Date();

      if (ticket.closed_by_admin) {
        ticket.status = 'Closed';
      }
    } 
    else {
      return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
    }

    await ticket.save();

    const updatedTicket = await ComplaintTicket.findById(id)
      .populate('reporter_id', 'first_name last_name email role')
      .populate('replies.sender_id', 'first_name last_name email role');

    return NextResponse.json({ 
      success: true, 
      message: `Action ${action} completed successfully`, 
      data: updatedTicket 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
