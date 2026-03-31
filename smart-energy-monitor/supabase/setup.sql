-- Create the user_settings table linking directly to the built-in auth.users
CREATE TABLE public.user_settings (
    id uuid references auth.users not null primary key,
    alert_email text,
    alert_phone text,
    send_email_alerts boolean default false,
    send_sms_alerts boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies so users can only read/update their own settings
CREATE POLICY "Users can view their own settings."
    ON public.user_settings FOR SELECT
    USING ( auth.uid() = id );

CREATE POLICY "Users can insert their own settings."
    ON public.user_settings FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own settings."
    ON public.user_settings FOR UPDATE
    USING ( auth.uid() = id );

-- Create a Trigger to automatically create a user_settings row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_settings (id, alert_email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
