/* ==========================
   SUPABASE INIT (GLOBAL FIX)
========================== */

const supabaseUrl = "https://isllunclzslpzkrlogpv.supabase.co";
const supabaseKey = "sb_publishable_Dv4Qg0mecaD41ZOQQrJ70A_47kWY81H";

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase initialized");
