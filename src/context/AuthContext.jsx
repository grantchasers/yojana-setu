/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export const AuthContext = createContext(null);

const DEMO_STORAGE_KEY = "yojana_demo_session";

export const DEMO_USER = {
  id: "demo-user",
  email: "ramesh.kumar@yojanasetu.gov.in",
  user_metadata: {
    full_name: "Ramesh Kumar",
    avatar_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBgw8NYcUh3xzIwD8jjd2eWp7EEJsH-FMUbDQP1tLW5T7ZK1n1hRZONM2rks1o7SPQ_gmZiWlt7lk5sSemjBMZd7LWdPHQHNGuMRlBC1B8Aq-U578C9T--OSFpnCsufjA0vJIPAPV5uMcXQRBVoEJz44aRV7VaLzpYO7sLw7paYDSfaJOVEKlpVSYAlHaly9oTDs1LQ_lHnUPu6JjREbdj3E7zeJbr_PvJEViIdQ_HMV_1Uya4xESBq",
  },
};

export const DEMO_PROFILE = {
  id: "demo-user",
  name: "",
  role: "applicant",
  avatar_url: DEMO_USER.user_metadata.avatar_url,
  verification_status: "unverified",
  documents: [],
};

function readDemoPreference() {
  try {
    const value = localStorage.getItem(DEMO_STORAGE_KEY);
    if (value === "0") return "off";
    if (value === "1") return "on";
  } catch {
    /* ignore */
  }
  return "off";
}

export function AuthProvider({ children }) {
  const initialPref = readDemoPreference();
  const initialIsDemo = initialPref === "on" || initialPref === "auto";

  const [user, setUser] = useState(() => (initialIsDemo ? DEMO_USER : null));
  const [profile, setProfile] = useState(() =>
    initialIsDemo ? DEMO_PROFILE : null,
  );
  const [loading, setLoading] = useState(() => !initialIsDemo);
  const [isDemo, setIsDemo] = useState(initialIsDemo);

  const applyDemo = useCallback(() => {
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setIsDemo(true);
    setLoading(false);
  }, []);

  const enterDemoMode = useCallback(
    () => {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      applyDemo();
    },
    [applyDemo],
  );

  useEffect(() => {
    let isMounted = true;

    const demoPref = readDemoPreference();
    if (demoPref === "on" || demoPref === "auto") {
      return () => {
        isMounted = false;
      };
    }

    const fetchProfile = async (userId) => {
      if (!userId) {
        if (isMounted) setProfile(null);
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (!isMounted) return null;

        if (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
          return null;
        }

        setProfile(data);
        return data;
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching profile:", err);
          setProfile(null);
        }
        return null;
      }
    };

    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timedOut: true }), 4000),
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then(async (outcome) => {
        if (!isMounted) return;

        if (outcome?.timedOut) {
          applyDemo();
          return;
        }

        const { data, error } = outcome || {};
        if (error) {
          console.error("Error getting session:", error);
        }

        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }

        if (isMounted) {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error getting session:", err);
          applyDemo();
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsDemo(false);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [applyDemo]);

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = (email, password, name) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
  };

  const signOut = async () => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, "0");
    } catch {
      /* ignore */
    }
    setIsDemo(false);
    setUser(null);
    setProfile(null);
    return supabase.auth.signOut();
  };

  const updateProfile = useCallback(
    async (changes) => {
      const nextProfile = { ...(profile || {}), ...changes };
      setProfile(nextProfile);
      try {
        localStorage.setItem(
          `yojana_profile_${user?.id || "demo-user"}`,
          JSON.stringify(nextProfile),
        );
      } catch {
        // Continue with the in-memory profile when browser storage is unavailable.
      }
      if (!isDemo && user?.id) {
        const { error } = await supabase
          .from("profiles")
          .update(changes)
          .eq("id", user.id);
        if (error) throw error;
      }
      return nextProfile;
    },
    [isDemo, profile, user?.id],
  );

  const value = {
    user,
    profile,
    loading,
    isDemo,
    signIn,
    signUp,
    signOut,
    enterDemoMode,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
