import { useState, useEffect } from "react";

export function useUserRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (isMounted) {
          setRoles([]);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
        const res = await fetch(`${backendUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data);
            setRoles(data.roles || ["pet_parent", "vet"]);
          }
        } else {
          // If token invalid, default to empty
          if (isMounted) {
            setRoles([]);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user roles:", err);
        // Fallback for dev mode / demo
        if (isMounted) {
          setRoles(["pet_parent", "vet"]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasRole = (role) => roles.includes(role);

  return { roles, hasRole, loading, user };
}
