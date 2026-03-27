import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full px-6 md:px-10 py-5 border-t border-white/10 bg-slate-950/80 text-slate-200 flex items-center justify-center mt-auto">
      <span className="text-xs md:text-sm tracking-wide">
        &copy; {new Date().getFullYear()} Heliocentric · AI-powered crop care
      </span>
    </footer>
  );
};

export default Footer;
