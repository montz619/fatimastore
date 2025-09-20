// Small helper to escape HTML when inserting untrusted strings into innerHTML
// Usage: const safe = window.escapeHTML(unsafeString);
(function () {
    function escapeHTML(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    window.escapeHTML = escapeHTML;
})();
