(function () {
    'use strict';

    const recipient = document.getElementById('recipient');
    const subject = document.getElementById('subject');
    const body = document.getElementById('body');
    const mailButton = document.getElementById('mailButton');
    const status = document.getElementById('status');

    function buildMailtoLink() {
        const qs =
            'subject=' + encodeURIComponent(subject.value) +
            '&body=' + encodeURIComponent(body.value);
        return 'mailto:' + recipient.value + '?' + qs;
    }

    function updateMailButton() {
        mailButton.href = buildMailtoLink();
    }

    let statusTimeout = 0;

    function showStatus(message) {
        status.textContent = message;
        window.clearTimeout(statusTimeout);
        statusTimeout = window.setTimeout(() => {
            status.textContent = '';
        }, 3500);
    }

    async function copyText(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            showStatus(message);
        } catch (error) {
            showStatus('Kopieren hat nicht automatisch funktioniert. Bitte markiere den Text und kopiere ihn manuell.');
        }
    }

    function copyField(id, message) {
        const field = document.getElementById(id);
        copyText(field.value, message);
    }

    document.querySelectorAll('[data-copy-target]').forEach((btn) => {
        btn.addEventListener('click', () => {
            copyField(btn.dataset.copyTarget, btn.dataset.copyMessage || 'Kopiert.');
        });
    });

    updateMailButton();
})();
