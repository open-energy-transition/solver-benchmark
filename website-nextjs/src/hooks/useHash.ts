import React from "react";

export const useHash = () => {
  const [hash, setHash] = React.useState("");

  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return hash;
};
