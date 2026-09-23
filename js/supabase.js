/* =========================================================
   OUR PLACE
   PHASE 2.2 — SUPABASE CONNECTION
========================================================= */


/*
    Your Supabase project URL.

    This identifies which Supabase project
    our website should connect to.
*/
const SUPABASE_URL =
  "https://rwuactmcswhffqnzngji.supabase.co";


/*
    Supabase PUBLISHABLE key.

    This key is allowed in browser code.

    IMPORTANT:
    Never put the Supabase SECRET key here.
*/
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4tUnQiuo3tsC5BCHrjyD1A_K-OK-wBf";


/*
    Make sure the Supabase JavaScript library
    has loaded before creating the client.
*/
if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {

  console.error(
    "Our Place: Supabase library did not load."
  );

} else {

  /*
      Create one Supabase client
      for the whole website.
  */
  const supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );


  /*
      Make the client available to main.js
      and the other future scripts.
  */
  window.ourPlaceSupabase =
    supabaseClient;


  /*
      Connection confirmation.
  */
  console.log(
    "Our Place: Supabase client connected."
  );

}