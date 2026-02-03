// SEO metadata generator
export const generateSEOData = (pageData) => {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    restaurantName,
    menuItems = []
  } = pageData;

  // Basic meta tags
  const metaTags = [
    { name: 'description', content: description },
    { name: 'keywords', content: `${restaurantName}, food, menu, delivery, restaurant` },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:title', content: title },
    { property: 'twitter:description', content: description },
    { property: 'twitter:image', content: image }
  ];

  // Structured data for restaurant
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurantName,
    url: url,
    description: description,
    image: image,
    servesCuisine: menuItems.map(item => item.category).filter((v, i, a) => a.indexOf(v) === i),
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: menuItems.reduce((sections, item) => {
        const section = sections.find(s => s.name === item.category);
        if (section) {
          section.hasMenuItem.push({
            '@type': 'MenuItem',
            name: item.name,
            description: item.description,
            price: `₹${item.price}`,
            image: item.image
          });
        } else {
          sections.push({
            '@type': 'MenuSection',
            name: item.category,
            hasMenuItem: [{
              '@type': 'MenuItem',
              name: item.name,
              description: item.description,
              price: `₹${item.price}`,
              image: item.image
            }]
          });
        }
        return sections;
      }, [])
    }
  };

  return { metaTags, structuredData };
};

// SEO hook
export const useSEO = (pageData) => {
  useEffect(() => {
    const { metaTags, structuredData } = generateSEOData(pageData);

    // Update document title
    document.title = pageData.title;

    // Update meta tags
    metaTags.forEach(tag => {
      let element = document.querySelector(`meta[${tag.name ? 'name' : 'property'}="${tag.name || tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (tag.name) element.name = tag.name;
        if (tag.property) element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.content = tag.content;
    });

    // Add structured data
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [pageData]);
}; 