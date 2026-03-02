// src/api/admin/staffService.js
import { supabase } from '../../../shared/supabase';

// Fetch all staff for a restaurant
export const fetchStaff = async (restaurantId) => {
  if (!restaurantId) throw new Error('No restaurant assigned.');
  // Simple access check
  const { error: simpleError } = await supabase
    .from('restaurant_staff')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .limit(1);
  if (simpleError) throw new Error(`Database access denied: ${simpleError.message}`);

  // Full staff fetch
  const { data, error } = await supabase
    .from('restaurant_staff')
    .select(`
      id,
      staff_role,
      staff_name,
      staff_email,
      staff_phone_number,
      connected,
      user_id,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('id', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Add a new staff member
export const addStaff = async (restaurantId, formData) => {
  if (!restaurantId) {
    throw new Error('Please select a restaurant first.');
  }

  // Check for existing staff in THIS restaurant
  const { data: existingStaff, error: existingStaffError } = await supabase
    .from('restaurant_staff')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('staff_email', formData.email)
    .single();
  if (existingStaffError && existingStaffError.code !== 'PGRST116') {
    throw new Error(existingStaffError.message || 'Failed to check existing staff member.');
  }
  if (existingStaff) throw new Error('A staff member with this email already exists for this restaurant.');

  // Check if they are attempting to be in MULTIPLE restaurants
  const { data: profileData } = await supabase
    .from('profiles')
    .select('profile_role')
    .eq('email', formData.email)
    .maybeSingle();

  const isOwnerOrAdmin = profileData?.profile_role === 'owner' || profileData?.profile_role === 'admin';

  if (!isOwnerOrAdmin) {
    const { data: otherRestaurantStaff } = await supabase
      .from('restaurant_staff')
      .select('restaurant_id')
      .eq('staff_email', formData.email)
      .neq('restaurant_id', restaurantId)
      .limit(1)
      .maybeSingle();

    if (otherRestaurantStaff) {
      throw new Error('This person is already working at another restaurant. Managers and staff can only be attached to a single restaurant.');
    }
  }

  // Insert new staff
  const { error: createError } = await supabase
    .from('restaurant_staff')
    .insert({
      restaurant_id: restaurantId,
      staff_name: formData.name,
      staff_email: formData.email,
      staff_phone_number: formData.phone_number,
      staff_role: formData.role
    });
  if (createError) {
    if (createError.message?.includes('violates check constraint "restaurant_staff_staff_role_check"')) {
      throw new Error(`The database doesn't support the '${formData.role}' role yet. Information: please contact tech support to update the database enum.`);
    }
    throw createError;
  }
  return true;
};

// Remove a staff member
export const removeStaff = async (staffId) => {
  const { error: deleteError } = await supabase
    .from('restaurant_staff')
    .delete()
    .eq('id', staffId);
  if (deleteError) throw deleteError;
  return true;
};

// Update a staff member
export const updateStaff = async (restaurantId, editingStaff, formData) => {
  if (!restaurantId) {
    throw new Error('Please select a restaurant first.');
  }

  // Check for email conflict
  if (formData.email !== editingStaff.staff_email) {
    const { data: existingStaff, error: existingStaffError } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('staff_email', formData.email)
      .neq('id', editingStaff.id)
      .single();
    if (existingStaffError && existingStaffError.code !== 'PGRST116') {
      throw new Error(existingStaffError.message || 'Failed to check existing staff member.');
    }
    if (existingStaff) throw new Error('A staff member with this email already exists for this restaurant.');
  }

  // Update staff
  const { error: updateError } = await supabase
    .from('restaurant_staff')
    .update({
      staff_name: formData.name,
      staff_email: formData.email,
      staff_phone_number: formData.phone_number,
      staff_role: formData.role
    })
    .eq('id', editingStaff.id);
  if (updateError) throw updateError;
  return true;
};

// Connect staff to user account
export const connectStaffUser = async (staffId, staffEmail) => {
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', staffEmail)
    .single();
  if (userError) {
    if (userError.code === 'PGRST116') {
      throw new Error('User not found. Please ensure the user has signed up first.');
    }
    throw userError;
  }
  const { error: updateError } = await supabase
    .from('restaurant_staff')
    .update({
      user_id: userData.id,
      connected: true
    })
    .eq('id', staffId);
  if (updateError) throw updateError;
  return true;
};
