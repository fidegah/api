(function () {
  const scriptTag = document.currentScript;
  const sdkToken = scriptTag?.dataset.sdkToken;

  if (!sdkToken) {
    console.error('Fidegah SDK: SDK Token is missing!');
    return;
  }

  const config = {
    position: scriptTag.dataset.position || 'right',
    theme: scriptTag.dataset.theme || 'light',
    size: scriptTag.dataset.size || 'default',
    layout: scriptTag.dataset.layout || 'sidebar',
    backdropBlur: scriptTag.dataset.blur === 'true',
    showButton: scriptTag.dataset.button === 'true',
  };

  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionId = `fs_external_${crypto.randomUUID()}`;
    } else {
      const buffer = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(buffer);
      }
      const cryptoFallback = Array.from(buffer)
        .map((b) => b.toString(36))
        .join('')
        .substring(0, 13);

      sessionId = `fs_external_${cryptoFallback}_${Date.now().toString(36)}`;
    }
    sessionId = sessionId.substring(0, 255);
    localStorage.setItem('sessionId', sessionId);
  }

  const deviceInfo = {
    sessionId: sessionId,
    currentUrl: globalThis.location.href,
  };

  const APP_DOMAIN = 'fidegah.ir';
  const IS_DEV =
    globalThis.location.hostname === 'localhost' ||
    globalThis.location.hostname === '127.0.0.1';

  const URLS = {
    host: IS_DEV ? 'http://localhost:3000' : `https://api.${APP_DOMAIN}`,
    widgetDomain: IS_DEV ? 'lvh.me:5173' : APP_DOMAIN,
    get api() {
      return `${this.host}/v1/sdk`;
    },
    get logo() {
      return `${this.host}/static/images/fidegah_logo_text.webp`;
    },
  };

  const apiUrl = URLS.api;
  const logoUrl = URLS.logo;

  let workspaceSubdomain = '';

  const initSessionPromise = fetch(`${apiUrl}/init-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sdk-token': sdkToken },
    body: JSON.stringify({ sdkToken, device: deviceInfo }),
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      console.log('Init Session Data:', data);

      const workspaceData = data.data;

      if (workspaceData.subdomain) {
        workspaceSubdomain = workspaceData.subdomain;
        if (workspaceData.position) config.position = workspaceData.position;
        if (workspaceData.theme) config.theme = workspaceData.theme;
        if (workspaceData.size) config.size = workspaceData.size;
        if (workspaceData.layout) config.layout = workspaceData.layout;
      } else {
        console.warn('Fidegah SDK: Subdomain not found in response', data);
      }
    })
    .catch((err) => console.error('Fidegah SDK Init Error:', err));

  const sizeMap = {
    horizontal: { default: '450px', half: '50vw', full: '100vw' },
    vertical: { default: '450px', half: '50vh', full: '100vh' },
  };

  let activeCloseHandler = null;

  function getLayoutConfiguration(
    activeLayout,
    activePosition,
    activeSize,
    colors,
    isMobile,
  ) {
    let layoutStyles = '';
    let hideTransform = '';
    let showTransform = '';
    let borderStyle = '';

    if (isMobile) {
      layoutStyles = 'top:0; left:0; width:100vw; height:100vh;';
      hideTransform = ['top', 'bottom'].includes(activePosition)
        ? 'translateY(100%)'
        : 'translateX(100%)';
      showTransform = 'translate(0)';
      return { layoutStyles, hideTransform, showTransform, borderStyle };
    }

    if (activeLayout === 'modal') {
      return {
        layoutStyles:
          'top: 50%; left: 50%; width: 500px; height: 85vh; border-radius: 16px; margin-top: -42.5vh; margin-left: -250px;',
        hideTransform: 'scale(0.9) translateY(20px)',
        showTransform: 'scale(1) translateY(0)',
        borderStyle: `border: 1px solid ${colors.border};`,
      };
    }

    if (activeLayout === 'floating') {
      const floatPos =
        activePosition === 'left' ? 'left: 20px;' : 'right: 20px;';
      return {
        layoutStyles: `bottom: 20px; ${floatPos} width: 420px; height: 82vh; border-radius: 16px;`,
        hideTransform: 'translateY(40px) scale(0.95)',
        showTransform: 'translateY(0) scale(1)',
        borderStyle: `border: 1px solid ${colors.border};`,
      };
    }

    const isHorizontal = ['right', 'left'].includes(activePosition);
    const sizeStyles = isHorizontal
      ? `width:${sizeMap.horizontal[activeSize] || '450px'}; height:100vh;`
      : `width:100vw; height:${sizeMap.vertical[activeSize] || '450px'};`;

    const positionStyles = {
      right: {
        layout: `top:0; right:0; ${sizeStyles}`,
        hide: 'translateX(100%)',
        show: 'translateX(0)',
      },
      left: {
        layout: `top:0; left:0; ${sizeStyles}`,
        hide: 'translateX(-100%)',
        show: 'translateX(0)',
      },
      top: {
        layout: `top:0; left:0; ${sizeStyles}`,
        hide: 'translateY(-100%)',
        show: 'translateY(0)',
      },
      bottom: {
        layout: `bottom:0; left:0; ${sizeStyles}`,
        hide: 'translateY(100%)',
        show: 'translateY(0)',
      },
    };

    const posConf = positionStyles[activePosition] || positionStyles.right;
    return {
      layoutStyles: posConf.layout,
      hideTransform: posConf.hide,
      showTransform: posConf.show,
      borderStyle,
    };
  }

  async function toggleFidegahWidget(options = {}) {
    await initSessionPromise;

    console.log(
      'workspaceSubdomain before loading iframe:',
      workspaceSubdomain,
    );

    if (!workspaceSubdomain) {
      console.error(
        'Fidegah SDK: Cannot open widget. Workspace subdomain is missing.',
      );
      return;
    }
    const existingWidget = document.getElementById('fidegah-widget-root');
    if (existingWidget) {
      existingWidget.remove();
      if (activeCloseHandler)
        globalThis.removeEventListener('keydown', activeCloseHandler);
      return;
    }

    const activeLayout = options.layout || config.layout;
    const activePosition =
      activeLayout === 'modal' ? 'center' : options.position || config.position;
    const activeTheme = options.theme || config.theme;
    const activeSize = options.size || config.size;
    const isBlurActive =
      options.blur === undefined
        ? config.backdropBlur
        : options.blur === 'true' || options.blur === true;
    const isDark = activeTheme === 'dark';
    const isMobile = window.innerWidth <= 768;

    const colors = isDark
      ? {
          background: 'oklch(0.24 0 0)',
          foreground: 'oklch(0.985 0 0)',
          border: 'oklch(1 0 0 / 10%)',
          accentHover: 'oklch(0.269 0 0)',
          cardBg: 'oklch(0.205 0 0)',
          skeletonLine: 'oklch(0.28 0 0)',
        }
      : {
          background: 'oklch(1 0 0)',
          foreground: 'oklch(0.145 0 0)',
          border: 'oklch(0.922 0 0)',
          accentHover: 'oklch(0.97 0 0)',
          cardBg: 'oklch(1 0 0)',
          skeletonLine: 'oklch(0.922 0 0)',
        };

    const { layoutStyles, hideTransform, showTransform, borderStyle } =
      getLayoutConfiguration(
        activeLayout,
        activePosition,
        activeSize,
        colors,
        isMobile,
      );

    const transitionStyle = `transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;`;

    const widgetBaseUrl = `https://${workspaceSubdomain}.${URLS.widgetDomain}`;
    const widgetUrl = `${widgetBaseUrl}/sdk/widget/feedback/board?sessionId=${sessionId}&theme=${activeTheme}&sdkToken=${sdkToken}`;

    if (!document.getElementById('fidegah-skeleton-style')) {
      const style = document.createElement('style');
      style.id = 'fidegah-skeleton-style';
      style.textContent = `
      @keyframes fidegah-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      .fidegah-pulse-elem { animation: fidegah-pulse 1.8s ease-in-out infinite; }
    `;
      document.head.appendChild(style);
    }

    const widgetRoot = document.createElement('div');
    widgetRoot.id = 'fidegah-widget-root';

    const blurEffect = isBlurActive
      ? 'backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);'
      : '';

    widgetRoot.innerHTML = `
    <div id="fidegah-backdrop" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); z-index:999998; transition: opacity 0.3s ease; opacity:0; ${blurEffect}"></div>
    <div id="fidegah-container" style="position:fixed; ${layoutStyles} ${borderStyle} background:${colors.background}; box-shadow:0 12px 40px rgba(0,0,0,0.18); z-index:999999; ${transitionStyle} transform: ${hideTransform}; opacity: 0; display:flex; flex-direction:column; overflow:hidden; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div id="fidegah-header" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:${colors.background}; border-bottom:1px solid ${colors.border}; min-height:50px; box-sizing:border-box; direction:ltr;">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${logoUrl}" alt="Fidegah Logo" style="height:28px; width:auto; object-fit:contain; display:block;" />
        </div>
        <button id="fidegah-close" style="background:none; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; color:${colors.foreground}; display:flex; align-items:center; justify-content:center; padding:0; transition: background-color 0.2s ease, transform 0.1s ease; outline:none;" 
                onmouseover="this.style.backgroundColor='${colors.accentHover}'" 
                onmouseout="this.style.backgroundColor='transparent'"
                onmousedown="this.style.transform='scale(0.95)'"
                onmouseup="this.style.transform='scale(1)'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div id="fidegah-body-wrapper" style="position:relative; flex:1; width:100%; height:100%; overflow:hidden;">
        <div id="fidegah-loader" style="position:absolute; top:0; left:0; width:100%; height:100%; background:${colors.background}; padding: 14px; box-sizing: border-box; display:flex; flex-direction:column; gap:14px; z-index:10; transition: opacity 0.3s ease, visibility 0.3s; direction: rtl; overflow: hidden;">
          <div style="border: 1px solid ${colors.border}; padding: 16px; border-radius: 10px; background: ${colors.cardBg}; display: flex; flex-direction: column; gap: 12px;">
            <div class="fidegah-pulse-elem" style="width: 35%; height: 16px; background: ${colors.skeletonLine}; border-radius: 4px;"></div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div class="fidegah-pulse-elem" style="width: 15%; height: 12px; background: ${colors.skeletonLine}; border-radius: 4px;"></div>
              <div class="fidegah-pulse-elem" style="width: 100%; height: 38px; background: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 10px;"></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div class="fidegah-pulse-elem" style="width: 20%; height: 12px; background: ${colors.skeletonLine}; border-radius: 4px;"></div>
              <div class="fidegah-pulse-elem" style="width: 100%; height: 75px; background: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 10px;"></div>
            </div>
            <div class="fidegah-pulse-elem" style="width: 100%; height: 40px; background: ${colors.skeletonLine}; border-radius: 10px;"></div>
          </div>
          <div style="border: 1px solid ${colors.border}; padding: 16px; border-radius: 10px; background: ${colors.cardBg}; display: flex; flex-direction: column; gap: 12px; flex: 1; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <div class="fidegah-pulse-elem" style="width: 20%; height: 16px; background: ${colors.skeletonLine}; border-radius: 4px;"></div>
              <div class="fidegah-pulse-elem" style="width: 18px; height: 18px; background: ${colors.skeletonLine}; border-radius: 50%;"></div>
            </div>
            <div style="border: 1px solid ${colors.border}; padding: 12px; border-radius: 10px; background: ${colors.background}; display: flex; justify-content: space-between; align-items: center;">
              <div class="fidegah-pulse-elem" style="width: 30%; height: 14px; background: ${colors.skeletonLine}; border-radius: 4px;"></div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="fidegah-pulse-elem" style="width: 16px; height: 16px; background: ${colors.skeletonLine}; border-radius: 4px;"></div>
                <div class="fidegah-pulse-elem" style="width: 32px; height: 36px; background: ${colors.border}; border-radius: 8px;"></div>
              </div>
            </div>
          </div>
        </div>
        <iframe id="fidegah-iframe" src="${widgetUrl}" style="width:100%; height:100%; border:none; display:block;"></iframe>
      </div>
    </div>
  `;

    document.body.appendChild(widgetRoot);

    setTimeout(() => {
      document.getElementById('fidegah-backdrop').style.opacity = '1';
      const container = document.getElementById('fidegah-container');
      container.style.transform = showTransform;
      container.style.opacity = '1';
    }, 10);

    const iframe = document.getElementById('fidegah-iframe');
    iframe.onload = function () {
      const loader = document.getElementById('fidegah-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        setTimeout(() => loader.remove(), 300);
      }
    };

    const closeWidget = () => {
      document.getElementById('fidegah-backdrop').style.opacity = '0';
      const container = document.getElementById('fidegah-container');
      container.style.transform = hideTransform;
      container.style.opacity = '0';
      setTimeout(() => {
        widgetRoot.remove();
        if (activeCloseHandler) {
          globalThis.removeEventListener('keydown', activeCloseHandler);
          activeCloseHandler = null;
        }
      }, 350);
    };

    activeCloseHandler = (e) => {
      if (e.key === 'Escape') closeWidget();
    };
    globalThis.addEventListener('keydown', activeCloseHandler);

    document
      .getElementById('fidegah-close')
      .addEventListener('click', closeWidget);
    document
      .getElementById('fidegah-backdrop')
      .addEventListener('click', closeWidget);
  }

  function renderDefaultFloatingButton() {
    if (!config.showButton) return;

    const btnSide = config.position === 'left' ? 'left: 24px;' : 'right: 24px;';
    const btnColor = config.theme === 'dark' ? '#ffffff' : '#0f172a';
    const btnBg = config.theme === 'dark' ? 'oklch(0.205 0 0)' : '#ffffff';
    const btnBorder =
      config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    const floatBtn = document.createElement('button');
    floatBtn.id = 'fidegah-floating-action-btn';
    floatBtn.style.cssText = `
      position: fixed; bottom: 24px; ${btnSide} z-index: 999990;
      display: flex; align-items: center; gap: 10px; padding: 0 18px; height: 48px;
      background: ${btnBg}; color: ${btnColor}; border: 1px solid ${btnBorder}; border-radius: 9999px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.12); font-size: 14px; font-weight: 600; cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
      font-family: system-ui, -apple-system, sans-serif; outline: none; direction: rtl;
    `;

    floatBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>ثبت بازخورد</span>
    `;

    floatBtn.addEventListener('mouseover', () => {
      floatBtn.style.transform = 'translateY(-3px) scale(1.02)';
      floatBtn.style.boxShadow = '0 6px 22px rgba(0,0,0,0.16)';
    });
    floatBtn.addEventListener('mouseout', () => {
      floatBtn.style.transform = 'translateY(0) scale(1)';
      floatBtn.style.boxShadow = '0 4px 18px rgba(0,0,0,0.12)';
    });
    floatBtn.addEventListener(
      'mousedown',
      () => (floatBtn.style.transform = 'scale(0.96)'),
    );

    floatBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleFidegahWidget();
    });

    document.body.appendChild(floatBtn);
  }

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    renderDefaultFloatingButton();
  } else {
    document.addEventListener('DOMContentLoaded', renderDefaultFloatingButton);
  }

  document.addEventListener('click', function (event) {
    const toggleBtn = event.target.closest('[data-fidegah-toggle]');
    if (toggleBtn) {
      event.preventDefault();
      toggleFidegahWidget({
        position: toggleBtn.dataset.position,
        theme: toggleBtn.dataset.theme,
        size: toggleBtn.dataset.size,
        layout: toggleBtn.dataset.layout,
        blur: toggleBtn.dataset.blur,
      });
    }
  });

  globalThis.Fidegah = {
    getSessionId: () => sessionId,
    open: function (options = {}) {
      toggleFidegahWidget(options);
    },
    identify: function (userData) {
      if (!userData?.id) {
        console.error('Fidegah SDK: User ID is required.');
        return;
      }
      fetch(`${apiUrl}/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sdk-token': sdkToken,
        },
        body: JSON.stringify({
          sdkToken,
          sessionId: sessionId,
          user: {
            id: String(userData.id),
            fullName: userData.name || userData.fullName,
            email: userData.email,
            avatarUrl: userData.avatarUrl,
          },
          verificationToken: userData.verificationToken,
        }),
      }).catch((err) => console.error('Fidegah SDK Identify Error:', err));
    },
  };
})();
