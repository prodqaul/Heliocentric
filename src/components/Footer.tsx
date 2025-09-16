import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full px-8 py-4 bg-zinc-900 text-white flex items-center justify-center mt-auto">
      <span className="text-sm font-mono">
        &copy; {new Date().getFullYear()} Heliocentric. All rights reserved.
      </span>
    </footer>
  );
};

export default Footer;
