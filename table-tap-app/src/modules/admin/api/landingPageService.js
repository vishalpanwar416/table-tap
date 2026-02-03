import { supabase } from '../../shared/supabase';

/**
 * Landing Page Content Service
 * Manages dynamic content for the landing page
 */

// Section keys
export const LANDING_SECTIONS = {
  HERO: 'hero',
  FEATURES: 'features',
  PRICING: 'pricing',
  TESTIMONIALS: 'testimonials',
  FAQ: 'faq',
  CONTACT: 'contact',
  FOOTER: 'footer'
};

/**
 * Get all landing page content
 */
export const getAllLandingContent = async () => {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    // Transform to key-value object for easier access
    const contentMap = {};
    data?.forEach(section => {
      contentMap[section.section_key] = section.content;
    });
    
    return { data: contentMap, rawData: data, error: null };
  } catch (error) {
    return { data: null, rawData: null, error: error.message };
  }
};

/**
 * Get a specific section content
 */
export const getSectionContent = async (sectionKey) => {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('*')
      .eq('section_key', sectionKey)
      .single();

    if (error) throw error;
    return { data: data?.content, rawData: data, error: null };
  } catch (error) {
    return { data: null, rawData: null, error: error.message };
  }
};

/**
 * Update a section content
 */
export const updateSectionContent = async (sectionKey, content) => {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('section_key', sectionKey)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update specific fields in a section
 */
export const updateSectionFields = async (sectionKey, fields) => {
  try {
    // Get current content
    const { data: current, error: fetchError } = await supabase
      .from('landing_page_content')
      .select('content')
      .eq('section_key', sectionKey)
      .single();

    if (fetchError) throw fetchError;

    // Merge with new fields
    const updatedContent = {
      ...current.content,
      ...fields
    };

    // Update
    const { data, error } = await supabase
      .from('landing_page_content')
      .update({ 
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('section_key', sectionKey)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Toggle section active status
 */
export const toggleSectionActive = async (sectionKey, isActive) => {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('section_key', sectionKey)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update section display order
 */
export const updateSectionOrder = async (sections) => {
  try {
    const updates = sections.map((section, index) => 
      supabase
        .from('landing_page_content')
        .update({ display_order: index + 1 })
        .eq('section_key', section.section_key)
    );

    await Promise.all(updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new section
 */
export const createSection = async (sectionData) => {
  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .insert([{
        section_key: sectionData.section_key,
        section_name: sectionData.section_name,
        content: sectionData.content || {},
        is_active: sectionData.is_active ?? true,
        display_order: sectionData.display_order || 99
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Delete a section
 */
export const deleteSection = async (sectionKey) => {
  try {
    const { error } = await supabase
      .from('landing_page_content')
      .delete()
      .eq('section_key', sectionKey);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============================================
// Convenience functions for specific sections
// =============================================

/**
 * Get hero section content
 */
export const getHeroContent = () => getSectionContent(LANDING_SECTIONS.HERO);

/**
 * Get features section content
 */
export const getFeaturesContent = () => getSectionContent(LANDING_SECTIONS.FEATURES);

/**
 * Get pricing section content
 */
export const getPricingContent = () => getSectionContent(LANDING_SECTIONS.PRICING);

/**
 * Update pricing plans
 */
export const updatePricingPlans = async (plans) => {
  return updateSectionFields(LANDING_SECTIONS.PRICING, { plans });
};

/**
 * Get testimonials
 */
export const getTestimonialsContent = () => getSectionContent(LANDING_SECTIONS.TESTIMONIALS);

/**
 * Add a testimonial
 */
export const addTestimonial = async (testimonial) => {
  const { data: current } = await getSectionContent(LANDING_SECTIONS.TESTIMONIALS);
  const testimonials = [...(current?.testimonials || []), testimonial];
  return updateSectionFields(LANDING_SECTIONS.TESTIMONIALS, { testimonials });
};

/**
 * Get FAQ content
 */
export const getFAQContent = () => getSectionContent(LANDING_SECTIONS.FAQ);

/**
 * Add a FAQ
 */
export const addFAQ = async (faq) => {
  const { data: current } = await getSectionContent(LANDING_SECTIONS.FAQ);
  const faqs = [...(current?.faqs || []), faq];
  return updateSectionFields(LANDING_SECTIONS.FAQ, { faqs });
};

/**
 * Get contact info
 */
export const getContactContent = () => getSectionContent(LANDING_SECTIONS.CONTACT);

/**
 * Update contact info
 */
export const updateContactInfo = async (contactInfo) => {
  return updateSectionContent(LANDING_SECTIONS.CONTACT, contactInfo);
};

export default {
  getAllLandingContent,
  getSectionContent,
  updateSectionContent,
  updateSectionFields,
  toggleSectionActive,
  updateSectionOrder,
  createSection,
  deleteSection,
  getHeroContent,
  getFeaturesContent,
  getPricingContent,
  updatePricingPlans,
  getTestimonialsContent,
  addTestimonial,
  getFAQContent,
  addFAQ,
  getContactContent,
  updateContactInfo,
  LANDING_SECTIONS
};
