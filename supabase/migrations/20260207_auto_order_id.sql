-- Create function to generate order number automatically
CREATE OR REPLACE FUNCTION generate_order_number_trigger()
RETURNS TRIGGER AS $$
DECLARE
    rest_name TEXT;
    rest_prefix TEXT;
    pay_code TEXT;
    time_suffix TEXT;
    random_digit TEXT;
BEGIN
    -- 1. Get Restaurant Name
    SELECT name INTO rest_name FROM restaurants WHERE id = NEW.restaurant_id;
    
    -- Fallback if restaurant not found (shouldn't happen with FKs but safe to have)
    IF rest_name IS NULL THEN
        rest_prefix := 'RST';
    ELSE
        -- Remove non-alphabetic chars and take first 3 uppercase
        rest_prefix := UPPER(SUBSTRING(REGEXP_REPLACE(rest_name, '[^a-zA-Z]', '', 'g'), 1, 3));
        -- Ensure at least 3 chars padding if name is short
        rest_prefix := RPAD(rest_prefix, 3, 'X');
    END IF;

    -- 2. Map Payment Method to Code
    -- Normalize input to lower case for comparison
    CASE LOWER(NEW.payment_method)
        WHEN 'razorpay' THEN pay_code := 'ONL'; -- Online
        WHEN 'upi' THEN pay_code := 'UPI';
        WHEN 'cod' THEN pay_code := 'CSH';      -- Cash on Delivery
        WHEN 'direct' THEN pay_code := 'DIR';   -- Direct / POS
        WHEN 'card' THEN pay_code := 'CRD';
        WHEN 'netbanking' THEN pay_code := 'NET';
        ELSE pay_code := 'GEN';                 -- General/Unknown
    END CASE;

    -- 3. Generate Suffix (HHMMSS + Random Digit)
    -- Using clock timestamp for high precision
    time_suffix := TO_CHAR(clock_timestamp(), 'HH24MISS'); 
    random_digit := FLOOR(RANDOM() * 10)::TEXT;

    -- 4. Construct Final Order Number
    NEW.order_number := rest_prefix || '-' || pay_code || '-' || time_suffix || random_digit;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS tr_generate_order_number ON orders;

CREATE TRIGGER tr_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number_trigger();
