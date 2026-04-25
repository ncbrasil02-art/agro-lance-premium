UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email = 'ncbrasil02@gmail.com';