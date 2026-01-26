-- Create function to increment execution count
create or replace function increment_executions(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update users
  set executions_count = executions_count + 1
  where id = user_id;
end;
$$;
