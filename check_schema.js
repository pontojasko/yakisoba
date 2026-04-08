require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

async function check() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Success. Data:", data);
  }
  
  const { data: insertData, error: insertError } = await supabase.from('orders').insert({
    customer_name: "Test",
    payment_method: "pix",
    total: 100,
    status: "pending"
  }).select();
  
  if (insertError) {
    console.error("Insert Error:", insertError);
  } else {
    console.log("Insert Success:", insertData);
    await supabase.from('orders').delete().eq('id', insertData[0].id);
  }
  process.exit();
}
check();
