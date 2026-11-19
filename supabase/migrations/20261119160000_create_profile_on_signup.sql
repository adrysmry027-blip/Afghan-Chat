-- Afghan Chat: create profile rows for new authentication users.
-- The private.handle_new_auth_user() trigger function was created earlier.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();
