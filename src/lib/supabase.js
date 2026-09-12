import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project") &&
  supabaseUrl.startsWith("http"),
);

function createDemoClient() {
  const empty = { data: [], error: null };
  const chain = (result = empty) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      insert: () => builder,
      update: () => builder,
      single: async () => ({
        data: Array.isArray(result.data)
          ? (result.data[0] ?? null)
          : result.data,
        error: result.error || { message: "Demo mode: no remote profile" },
      }),
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return builder;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: {
          message: "Cloud auth is not configured. Use evaluator demo access.",
        },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: {
          message: "Cloud auth is not configured. Use evaluator demo access.",
        },
      }),
      signOut: async () => ({ error: null }),
    },
    from: (table) => {
      if (table === "applications") {
        return chain({
          data: [],
          error: null,
        });
      }
      if (table === "channel_partners") {
        return chain({
          data: [
            {
              id: "sca-lucknow",
              name: "UP Scheduled Castes Finance Development Corporation",
              city: "Lucknow",
              district: "Lucknow",
              state: "Uttar Pradesh",
              type: "SCA",
              lat: 26.8467,
              lng: 80.9462,
              phone: "0522-2234567",
              address: "TC/46-V, Vibhuti Khand, Gomti Nagar, Lucknow",
              is_eligible: true,
              accepted_scheme_types: [
                "term_loan",
                "micro_finance",
                "education_loan",
              ],
            },
            {
              id: "psb-kanpur",
              name: "State Bank of India — Kanpur Main",
              city: "Kanpur",
              district: "Kanpur Nagar",
              state: "Uttar Pradesh",
              type: "PSB",
              lat: 26.4499,
              lng: 80.3319,
              phone: "1800-11-2211",
              address: "Mall Road, Kanpur",
              is_eligible: true,
              accepted_scheme_types: ["term_loan", "education_loan"],
            },
            {
              id: "rrb-varanasi",
              name: "Aryavart Bank — Varanasi Branch",
              city: "Varanasi",
              district: "Varanasi",
              state: "Uttar Pradesh",
              type: "RRB",
              lat: 25.3176,
              lng: 82.9739,
              phone: "0542-2228899",
              address: "Lanka, Varanasi",
              is_eligible: true,
              accepted_scheme_types: ["micro_finance", "term_loan"],
            },
          ],
          error: null,
        });
      }
      return chain(empty);
    },
    channel: () => ({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
      unsubscribe() {},
    }),
    removeChannel() {},
  };
}

let client;
if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn(
      "[Supabase] Failed to initialize Supabase client, falling back to demo mode:",
      err,
    );
    client = createDemoClient();
  }
} else {
  console.info(
    "[Supabase] Missing or placeholder credentials. Operating in offline demo mode.",
  );
  client = createDemoClient();
}

export const supabase = client;
