import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ComplaintOption from '@/models/ComplaintOption';
import { getAuthenticatedUser } from '@/lib/auth';

// PATCH: Update option value (Super Admin only)
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { value, associated_titles } = await request.json();

    if (!value || !value.trim()) {
      return NextResponse.json({ success: false, message: 'Value is required' }, { status: 400 });
    }

    const updateFields = { value: value.trim() };
    if (associated_titles !== undefined) {
      updateFields.associated_titles = Array.isArray(associated_titles) ? associated_titles : [];
    }

    const updatedOption = await ComplaintOption.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('associated_titles', 'value');

    if (!updatedOption) {
      return NextResponse.json({ success: false, message: 'Option not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Option updated successfully', data: updatedOption }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Remove option (Super Admin only)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const tokenUser = await getAuthenticatedUser(request);

    if (!tokenUser || tokenUser.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const deletedOption = await ComplaintOption.findByIdAndDelete(id);

    if (!deletedOption) {
      return NextResponse.json({ success: false, message: 'Option not found' }, { status: 404 });
    }

    // If a title option is deleted, pull its ID from all subtitle options
    if (deletedOption.type === 'title') {
      await ComplaintOption.updateMany(
        { type: 'subtitle', associated_titles: id },
        { $pull: { associated_titles: id } }
      );
    }

    return NextResponse.json({ success: true, message: 'Option deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
