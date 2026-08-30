/*
  PreCardAI — Simple Share utility (Phase 1)
  Handles sharing the site link via WhatsApp, Facebook, and native share
  (which lets the user pick Instagram or any other installed app).

  Note on Instagram: there is no public web link that lets a website
  pre-fill a share directly into Instagram — that's a platform
  restriction, not something any site can work around. The native share
  sheet (navigator.share) is the standard workaround: it lets the user
  pick Instagram, WhatsApp, or anything else themselves.

  Referral tracking is NOT included here — that needs a backend/database
  and is planned for Phase 2.
*/

const PreCardShare = (() => {
  function shareWhatsApp(text, url) {
    const message = encodeURIComponent(`${text} ${url}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  function shareFacebook(url) {
    const encoded = encodeURIComponent(url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, "_blank");
  }

  async function shareNative(title, text, url) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (e) {
        return false; // user cancelled or unsupported
      }
    }
    return false;
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Wires up buttons inside a container.
   * Expects buttons with data-share="whatsapp" | "facebook" | "native"
   */
  function initShareButtons(container, { title, text, url }) {
    if (!container) return;
    container.querySelectorAll("[data-share]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const type = btn.dataset.share;
        if (type === "whatsapp") return shareWhatsApp(text, url);
        if (type === "facebook") return shareFacebook(url);
        if (type === "native") {
          const ok = await shareNative(title, text, url);
          if (!ok) {
            const copied = await copyLink(url);
            alert(copied ? "Link copied — paste it into Instagram or anywhere else." : url);
          }
        }
      });
    });
  }

  return { shareWhatsApp, shareFacebook, shareNative, copyLink, initShareButtons };
})();
