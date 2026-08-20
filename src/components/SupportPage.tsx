import React from "react";
import { useState } from "react";

const SUPPORT_CONTACT = {
  whatsappNumber: "250789438437",
  phoneNumber: "+250789438437",
  email: "aphrodisu2019@gmail.com",
};

const emailLink = `mailto:${SUPPORT_CONTACT.email}?subject=${encodeURIComponent(
  "Climavise Support Request"
)}`;
const callLink = `tel:${SUPPORT_CONTACT.phoneNumber}`;
const smsLink = `sms:${SUPPORT_CONTACT.phoneNumber}?body=${encodeURIComponent(
  "Hello Climavise Support, I need assistance."
)}`;

const SupportPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [issue, setIssue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const openWhatsappModal = () => {
    setFormError(null);
    setIsWhatsappModalOpen(true);
  };

  const closeWhatsappModal = () => {
    setIsWhatsappModalOpen(false);
    setFormError(null);
  };

  const handleWhatsappContinue = () => {
    if (!name.trim() || !contactAddress.trim() || !issue.trim()) {
      setFormError("Please fill in name, contact address, and issue.");
      return;
    }

    const whatsappText = [
      "Hello Climavise Support, I need help.",
      `Name: ${name.trim()}`,
      `Contact: ${contactAddress.trim()}`,
      `Issue: ${issue.trim()}`,
    ].join("\n");

    const link = `https://wa.me/${SUPPORT_CONTACT.whatsappNumber}?text=${encodeURIComponent(
      whatsappText
    )}`;
    window.open(link, "_blank", "noopener,noreferrer");
    closeWhatsappModal();
  };

  return (
    <section
      className={`relative px-4 md:px-10 pb-12 ${embedded ? "pt-8" : "pt-28"}`}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 left-10 h-72 w-72 bg-emerald-700/25 blur-3xl rounded-full" />
        <div className="absolute top-20 right-10 h-72 w-72 bg-green-900/30 blur-3xl rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="mb-8 md:mb-10">
          <p className="text-emerald-300 uppercase tracking-[0.25em] text-xs mb-3">
            Climavise Support
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            Contact the support team fast.
          </h1>
          <p className="text-slate-300 mt-4 max-w-3xl">
            Choose your preferred channel and reach the Climavise support team
            for diagnosis issues, account questions, or technical help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={openWhatsappModal}
            className="group rounded-3xl border border-emerald-400/30 bg-white/5 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/10"
          >
            <p className="text-emerald-300 text-xs tracking-[0.2em] uppercase">
              WhatsApp
            </p>
            <h2 className="text-white text-2xl font-semibold mt-2">
              Chat Support
            </h2>
            <p className="text-slate-300 mt-3 text-sm">
              Start a direct WhatsApp conversation with the Climavise support
              team.
            </p>
          </button>

          <a
            href={emailLink}
            className="group rounded-3xl border border-emerald-400/30 bg-white/5 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/10"
          >
            <p className="text-emerald-300 text-xs tracking-[0.2em] uppercase">
              Email
            </p>
            <h2 className="text-white text-2xl font-semibold mt-2">
              {SUPPORT_CONTACT.email}
            </h2>
            <p className="text-slate-300 mt-3 text-sm">
              Send details, screenshots, and logs for deeper technical support.
            </p>
          </a>

          <a
            href={callLink}
            className="group rounded-3xl border border-emerald-400/30 bg-white/5 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/10"
          >
            <p className="text-emerald-300 text-xs tracking-[0.2em] uppercase">
              Call
            </p>
            <h2 className="text-white text-2xl font-semibold mt-2">
              {SUPPORT_CONTACT.phoneNumber}
            </h2>
            <p className="text-slate-300 mt-3 text-sm">
              Call support directly for urgent help with predictions or app
              usage.
            </p>
          </a>

          <a
            href={smsLink}
            className="group rounded-3xl border border-emerald-400/30 bg-white/5 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/10"
          >
            <p className="text-emerald-300 text-xs tracking-[0.2em] uppercase">
              SMS
            </p>
            <h2 className="text-white text-2xl font-semibold mt-2">
              Send Text Message
            </h2>
            <p className="text-slate-300 mt-3 text-sm">
              Send a quick message and the support team will reply as soon as
              possible.
            </p>
          </a>
        </div>
      </div>

      {isWhatsappModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-1">
              Contact via WhatsApp
            </h3>
            <p className="text-slate-300 text-sm mb-5">
              Fill this first, then continue to WhatsApp.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-200 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-400"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-200 mb-1">
                  Contact address
                </label>
                <input
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-400"
                  placeholder="Phone, email, or location"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-200 mb-1">Issue</label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-400"
                  placeholder="Describe your issue"
                />
              </div>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeWhatsappModal}
                className="px-4 py-2 rounded-xl bg-slate-700/70 text-slate-200 hover:bg-slate-600/70 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWhatsappContinue}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 text-white font-medium hover:from-emerald-600 hover:to-green-500 transition"
              >
                Continue to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SupportPage;
