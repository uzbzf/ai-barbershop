function installDevMainButton() {
  let handler = null;
  let existing = document.getElementById("tg-dev-main");
  if (!existing) {
    existing = document.createElement("button");
    existing.id = "tg-dev-main";
    existing.type = "button";
    existing.className = "tg-dev-main";
    existing.hidden = true;
    document.body.appendChild(existing);
  }
  existing.onclick = () => handler?.();
  return {
    show() {
      existing.hidden = false;
    },
    hide() {
      existing.hidden = true;
    },
    setText(text) {
      existing.textContent = text;
    },
    onClick(fn) {
      handler = fn;
    },
    offClick() {
      handler = null;
    },
  };
}

export async function applyLocalTelegram() {
  if (typeof window === "undefined") return { mocked: false };
  if (window.Telegram?.WebApp?.initData) return { mocked: false };

  try {
    const response = await fetch("/api/tg/dev-session");
    if (!response.ok) return { mocked: false };
    const session = await response.json();
    window.Telegram = {
      WebApp: {
        initData: session.initData,
        initDataUnsafe: session.initDataUnsafe,
        colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
        themeParams: {},
        ready() {},
        expand() {},
        close() {},
        MainButton: installDevMainButton(),
        HapticFeedback: {
          selectionChanged() {},
          notificationOccurred() {},
        },
        onEvent() {},
        offEvent() {},
      },
    };
    return { mocked: true };
  } catch {
    return { mocked: false };
  }
}
