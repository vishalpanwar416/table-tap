-- Update landing_hero content to match the existing JSON structure exactly
UPDATE public.system_settings 
SET value = '{
    "titlePrefix": "Dining is about",
    "titleMain": "the Memory.",
    "subtitle": "Every great meal tells a story. We built Table Tap to fade into the background—so nothing stands between your guests and the moments they''ll remember forever. Seamless ordering. Effortless service. Pure hospitality.",
    "ctaPrimary": {
        "text": "Start Your Free Trial",
        "href": "#"
    },
    "ctaSecondary": {
        "text": "Watch Demo",
        "href": "#services"
    },
    "stats": [
        {
            "label": "Guest Satisfaction",
            "value": "98%"
        },
        {
            "label": "Orders Processed",
            "value": "2M+"
        }
    ]
}'::jsonb
WHERE key = 'landing_hero';
