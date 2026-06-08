import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Complaint from '@/models/Complaint';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    
    if (!tokenUser || (tokenUser.role !== 'super_admin' && tokenUser.role !== 'admin')) {
      return NextResponse.json({ success: false, message: 'Only Admins can perform this action' }, { status: 403 });
    }

    const complaintId = params.id;
    const body = await request.json();
    const { action, resolution_note } = body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ success: false, message: 'Complaint not found' }, { status: 404 });
    }

    if (action === 'status') {
      const { status } = body;
      if (!['Pending', 'Under Review'].includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid status update' }, { status: 400 });
      }
      complaint.complaint_status = status;
    } 
    else if (action === 'resolve') {
      complaint.complaint_status = 'Resolved';
      complaint.resolution_note = resolution_note || '';
      complaint.resolved_by = tokenUser.userId;
      complaint.resolved_at = new Date();
    }
    else if (action === 'reject') {
      complaint.complaint_status = 'Rejected';
      complaint.resolution_note = resolution_note || '';
      complaint.resolved_by = tokenUser.userId;
      complaint.resolved_at = new Date();
    }
    else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await complaint.save();

    return NextResponse.json({ success: true, message: `Complaint ${action} successful` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
