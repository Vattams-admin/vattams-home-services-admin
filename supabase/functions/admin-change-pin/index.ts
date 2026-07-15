import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { current_pin, new_pin } = await req.json();

    if (!current_pin || !new_pin || typeof current_pin !== "string" || typeof new_pin !== "string") {
      return new Response(
        JSON.stringify({ error: "Current PIN and new PIN are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!/^\d{6}$/.test(new_pin)) {
      return new Response(
        JSON.stringify({ error: "New PIN must be exactly 6 digits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (current_pin === new_pin) {
      return new Response(
        JSON.stringify({ error: "New PIN must be different from current PIN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: row, error: fetchError } = await supabase
      .from("admin_pin_settings")
      .select("id, pin_hash")
      .limit(1)
      .maybeSingle();

    if (fetchError || !row) {
      return new Response(
        JSON.stringify({ error: "Invalid current PIN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: isValid, error: verifyErr } = await supabase.rpc(
      "verify_admin_pin",
      { input_pin: current_pin, stored_hash: row.pin_hash },
    );

    if (verifyErr || !isValid) {
      return new Response(
        JSON.stringify({ error: "Current PIN is incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: hashError, data: newHash } = await supabase.rpc(
      "hash_admin_pin",
      { input_pin: new_pin },
    );

    if (hashError || !newHash) {
      return new Response(
        JSON.stringify({ error: "Failed to hash new PIN" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateError } = await supabase
      .from("admin_pin_settings")
      .update({
        pin_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update PIN" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "PIN changed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to change PIN" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
