import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: List all admins and super_admins
export async function GET(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    // Only super_admin and admin can view admins
    if (!tokenUser || (tokenUser.role !== 'super_admin' && tokenUser.role !== 'admin')) {
      return NextResponse.json({ message: 'Unauthorized access' }, { status: 403 });
    }

    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-password')
      .populate('created_by', 'first_name last_name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: admins }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admins ERROR:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new admin or super_admin
export async function POST(request) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    // Only super_admin can create new admins
    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ message: 'Only Super Admins can create admins' }, { status: 403 });
    }

    const { first_name, last_name, email, password, role } = await request.json();

    if (!first_name || !last_name || !email || !password || !role) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create username from email prefix or generate one
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    const newAdmin = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      role,
      status: 'active',
      created_by: tokenUser.userId,
      auth_provider: 'local',
      phone: 'N/A', // Bypassing required phone for admins
    });

    return NextResponse.json({ success: true, message: 'Admin created successfully', data: { id: newAdmin._id } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
