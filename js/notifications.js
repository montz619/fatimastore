// notifications.js - lightweight client-side toasts and confirm modal (no dependencies)
(function(){
    const TOAST_DURATION = 4500;

    // Create toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.right = '1rem';
        toastContainer.style.bottom = '1rem';
        toastContainer.style.zIndex = '14000';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.gap = '0.5rem';
        document.body.appendChild(toastContainer);
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
        const t = setTimeout(remove, opts.duration || TOAST_DURATION);
        // pause on hover
        el.addEventListener('mouseenter', () => clearTimeout(t));
        return { remove };
    }

    async function confirm(message, options) {
        options = options || {};
        const msgEl = confirmModal.querySelector('#notify-confirm-message');
        const okBtn = confirmModal.querySelector('#notify-confirm-ok');
        const cancelBtn = confirmModal.querySelector('#notify-confirm-cancel');

        msgEl.textContent = message || '';
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
            function onKey(e) { if (e.key === 'Escape') { onCancel(); } }
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
