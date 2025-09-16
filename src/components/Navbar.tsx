import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full px-8 py-4 bg-zinc-900 text-white shadow flex items-center fixed top-0 z-50">
      <span className="font-bold text-2xl tracking-wide font-mono">
        Heliocentric
      </span>
    </nav>
  );
};

export default Navbar;
