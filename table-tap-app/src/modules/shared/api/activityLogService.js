import { supabase } from '../supabase';

/**
 * Log an activity to the unified activity_logs table
 * @param {Object} logData - The log entry data
 * @param {string} logData.restaurant_id - Restaurant ID
 * @param {string} logData.user_id - User ID
 * @param {string} logData.user_name - User Name
 * @param {string} logData.user_role - User Role
 * @param {string} logData.action_type - Type of action (order, menu, inventory, etc)
 * @param {string} logData.action_name - Specific action (status_change, item_added, etc)
 * @param {string} [logData.target_id] - ID of the target object
 * @param {string} [logData.target_name] - Name/Display ID of target object
 * @param {Object} [logData.details] - JSON detail of changes
 * @param {string} [logData.description] - Human readable description
 */
export const logActivity = async (logData) => {
    try {
        const { error } = await supabase
            .from('activity_logs')
            .insert([{
                restaurant_id: logData.restaurant_id,
                user_id: logData.user_id,
                user_name: logData.user_name,
                user_role: logData.user_role,
                action_type: logData.action_type,
                action_name: logData.action_name,
                target_id: logData.target_id,
                target_name: logData.target_name,
                details: logData.details || {},
                description: logData.description,
                timestamp: new Date().toISOString()
            }]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error logging activity:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get unified activity logs for a restaurant
 */
export const getActivityLogs = async (restaurantId, page = 1, pageSize = 50) => {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact' })
            .eq('restaurant_id', restaurantId)
            .order('timestamp', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, count, error: null };
    } catch (error) {
        return { data: null, error: error.message };
    }
};
