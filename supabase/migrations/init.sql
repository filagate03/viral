create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,                  -- id из auth.users
  email text unique,                    -- почта
  role text default 'starter' check (role in ('free','starter','pro','admin','support')),
  trial_ends_at timestamptz,            -- конец пробного периода
  device_fp_hash text,                  -- антиабуз по устройству
  ip_hash text,                         -- антиабуз по IP
  created_at timestamptz default now()
);

-- чтобы таблица была защищена
alter table users enable row level security;

-- правило: юзер видит только себя
create policy "Users can view themselves"
  on users for select
  using (auth.uid() = id);

-- триггер, чтобы строка в users создавалась автоматом после регистрации
create or replace function public.ensure_user_row()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'starter')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.ensure_user_row();
