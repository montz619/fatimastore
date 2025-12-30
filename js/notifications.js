// notifications.js - lightweight client-side toasts and confirm modal (no dependencies)
(function(){
    const TOAST_DURATION = 4500;

    // Create toast container (centered, placed right below the site header when possible)
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        // default top until we compute header height
        toastContainer.style.top = '4rem';
        toastContainer.style.zIndex = '14000';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.alignItems = 'center';
        toastContainer.style.gap = '0.5rem';
        toastContainer.style.pointerEvents = 'none';
        document.body.appendChild(toastContainer);

        // Compute and set top to sit just below the header if present
        const updateToastTop = () => {
            try {
                const header = document.querySelector('header');
                if (header) {
                    const rect = header.getBoundingClientRect();
                    // If header is fixed/sticky at top, its height determines our top offset
                    const topOffset = Math.max(8, Math.round(rect.height + 8));
                    toastContainer.style.top = topOffset + 'px';
                } else {
                    // fallback
                    toastContainer.style.top = '4rem';
                }
            } catch (e) {
                toastContainer.style.top = '4rem';
            }
        };
        updateToastTop();
        window.addEventListener('resize', updateToastTop);
        // Also update on page layout changes (in case header height changes)
        const observer = new MutationObserver(updateToastTop);
        const hdr = document.querySelector('header');
        if (hdr) observer.observe(hdr, { attributes: true, childList: true, subtree: true });
    }

    // Create confirm modal container
    let confirmModal = document.getElementById('notify-confirm-modal');
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'notify-confirm-modal';
        confirmModal.className = 'notify-confirm hidden';
        confirmModal.innerHTML = `
            <div class="notify-confirm-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div class="notify-confirm-inner bg-white rounded-xl p-6 w-full max-w-md" role="dialog" aria-modal="true">
                    <div id="notify-confirm-message" class="text-gray-800 mb-4"></div>
                    <div class="flex justify-end gap-3">
                        <button id="notify-confirm-cancel" class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button id="notify-confirm-ok" class="px-4 py-2 bg-indigo-600 text-white rounded">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
    }

    function makeToast(message, opts) {
        opts = opts || {};
        const el = document.createElement('div');
        el.className = 'notify-toast shadow-md rounded px-4 py-2 flex items-center gap-3';
        el.style.background = opts.background || (opts.type === 'error' ? '#fee2e2' : opts.type === 'success' ? '#ecfdf5' : '#eef2ff');
        el.style.color = '#111827';
        el.style.minWidth = '220px';
        el.style.maxWidth = '360px';
        el.style.boxSizing = 'border-box';
        el.setAttribute('role','status');
        el.style.pointerEvents = 'auto';

        const txt = document.createElement('div');
        txt.style.flex = '1';
        txt.style.fontSize = '0.95rem';
        txt.textContent = message || '';
        el.appendChild(txt);

        if (opts.undo && typeof opts.undo === 'function') {
            const u = document.createElement('button');
            u.className = 'notify-undo-btn text-indigo-600 font-semibold';
            u.textContent = 'Undo';
            u.style.background = 'transparent';
            u.style.border = 'none';
            u.style.cursor = 'pointer';
            u.onclick = () => {
                try { opts.undo(); } catch (e) { console.error(e); }
                remove();
            };
            el.appendChild(u);
        }

        function remove() {
            if (!el.parentNode) return;
            el.style.transition = 'opacity 160ms ease-out, transform 160ms ease-out';
            el.style.opacity = '0';
            el.style.transform = 'translateY(6px)';
            setTimeout(() => { try { el.remove(); } catch (e) {} }, 180);
        }

        toastContainer.appendChild(el);
        // auto-dismiss
        // Auto-dismiss with pause/resume on hover
        let duration = opts.duration || TOAST_DURATION;
        let start = Date.now();
        let remaining = duration;
        let timer = setTimeout(remove, remaining);

        function pause() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
                const elapsed = Date.now() - start;
                remaining = Math.max(0, remaining - elapsed);
            }
        }
        function resume() {
            if (!timer) {
                start = Date.now();
                timer = setTimeout(remove, remaining);
            }
        }

        el.addEventListener('mouseenter', pause);
        el.addEventListener('mouseleave', resume);
        // allow tap/click to immediately dismiss (helpful on mobile)
        el.addEventListener('click', () => { remove(); });
        // expose removal handle
        return { remove };
    }

    async function confirm(message, options) {
        options = options || {};
        const msgEl = confirmModal.querySelector('#notify-confirm-message');
        const okBtn = confirmModal.querySelector('#notify-confirm-ok');
        const cancelBtn = confirmModal.querySelector('#notify-confirm-cancel');

        msgEl.textContent = message || '';
        // If caller requests ok-only dialogs (no cancel), hide cancel button
        if (options.okOnly) {
            cancelBtn.style.display = 'none';
        } else {
            cancelBtn.style.display = '';
        }

        confirmModal.classList.remove('hidden');
        // focus management
        setTimeout(() => { okBtn.focus(); }, 60);

        return new Promise((resolve) => {
            function cleanup() {
                confirmModal.classList.add('hidden');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKey);
            }
            function onOk() { cleanup(); resolve(true); }
            function onCancel() { cleanup(); resolve(false); }
            function onKey(e) {
                if (e.key === 'Escape') {
                    // If okOnly, treat Escape as OK to allow quick dismissal; otherwise cancel
                    if (options.okOnly) onOk(); else onCancel();
                }
            }
            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKey);
        });
    }

    window.notify = {
        success: (msg, opts) => makeToast(msg, Object.assign({ type: 'success' }, opts)),
        info: (msg, opts) => makeToast(msg, Object.assign({ type: 'info' }, opts)),
        error: (msg, opts) => makeToast(msg, Object.assign({ type: 'error' }, opts)),
        confirm: (msg, opts) => confirm(msg, opts)
    };
})();
