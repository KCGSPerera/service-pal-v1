import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);
    
    // Only super admin can modify admins
    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Only Super Admins can perform this action' }, { status: 403 });
    }

    const adminId = params.id;
    const body = await request.json();
    const { action, payload } = body;

    const adminToUpdate = await User.findById(adminId);
    if (!adminToUpdate) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    // Protection for super_admin self-actions
    if (adminId === tokenUser.userId && (action === 'deactivate' || action === 'change-role')) {
      return NextResponse.json({ success: false, message: 'You cannot deactivate or downgrade your own account' }, { status: 403 });
    }

    switch (action) {
      case 'activate':
        adminToUpdate.status = 'active';
        break;
      case 'deactivate':
        adminToUpdate.status = 'blocked';
        break;
      case 'change-role':
        if (!['admin', 'super_admin'].includes(payload.role)) {
          return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
        }
        adminToUpdate.role = payload.role;
        break;
      case 'reset-password':
        if (!payload.password) {
          return NextResponse.json({ success: false, message: 'New password is required' }, { status: 400 });
        }
        const salt = await bcrypt.genSalt(10);
        adminToUpdate.password = await bcrypt.hash(payload.password, salt);
        break;
      case 'update-profile':
        if (payload.first_name) adminToUpdate.first_name = payload.first_name;
        if (payload.last_name) adminToUpdate.last_name = payload.last_name;
        break;
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await adminToUpdate.save();

    return NextResponse.json({ success: true, message: `Admin ${action} successful` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
