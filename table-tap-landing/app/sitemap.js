export default function sitemap() {
  const baseUrl = 'https://table-tap.in';

  const locations = [
    'hyderabad', 'bangalore', 'delhi', 'mumbai',
    'pune', 'chennai', 'kolkata', 'ahmedabad', 'jaipur'
  ];

  const industries = [
    'cafes', 'fine-dining', 'bars', 'qsr'
  ];

  const solutions = [
    'qr-menu', 'restaurant-management', 'whatsapp-ordering'
  ];

  const services = [
    'payments', 'menu-management', 'analytics',
    'pos-dashboard', 'kds', 'restaurant-services'
  ];

  const staticPages = [
    { url: '', priority: 1, changeFrequency: 'weekly' },
    { url: '/partners', priority: 0.9, changeFrequency: 'weekly' },
    { url: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
    { url: '/terms', priority: 0.3, changeFrequency: 'monthly' },
    { url: '/refunds', priority: 0.3, changeFrequency: 'monthly' },
  ];

  return [
    ...staticPages.map(page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...locations.map(city => ({
      url: `${baseUrl}/locations/${city}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...industries.map(ind => ({
      url: `${baseUrl}/industries/${ind}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...solutions.map(sol => ({
      url: `${baseUrl}/solutions/${sol}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...services.map(svc => ({
      url: `${baseUrl}/services/${svc}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ];
}
