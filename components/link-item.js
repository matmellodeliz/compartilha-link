class LinkItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._linkData = null;
        this._qrVisible = false;
        this._qrInstance = null;
    }

    set link(data) {
        if (!data || !data.id || !data.name || !data.url) { return; }
        this._linkData = data;
        this._render();
        this._attachEvents();
    }

    get link() { return this._linkData; }

    _render() {
        if (!this._linkData) return;
        const { id, name, url } = this._linkData;
        const canShare = 'share' in navigator;
        const shortUrlHash = `#${id}`;
        let basePath = window.location.pathname.replace(/index\.html$/, ''); // Remove index.html
        const displayShortUrl = basePath + shortUrlHash;

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; padding: 1em 1.2em; border-bottom: 1px solid #eee; background-color: #fff; transition: background-color 0.2s ease; }
                :host(:hover) { background-color: #f8f9fa; }
                .content-wrapper { display: flex; justify-content: space-between; align-items: flex-start; gap: 1em; flex-wrap: wrap; }
                .link-info { flex-grow: 1; min-width: 200px; overflow: hidden; }
                .link-name { font-weight: bold; font-size: 1.1em; display: block; margin-bottom: 0.3em; color: #343a40; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .link-url { color: #007bff; text-decoration: none; font-size: 0.9em; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.5em; }
                .link-url:hover { text-decoration: underline; }
                .short-link-container { font-size: 0.85em; color: #6c757d; margin-bottom: 0.8em; }
                .short-link-container span { margin-right: 0.4em; font-weight: 500; }
                .short-link { color: #17a2b8; text-decoration: none; font-weight: bold; word-break: break-all; }
                .short-link:hover { text-decoration: underline; }
                .actions { display: flex; gap: 0.6em; flex-shrink: 0; align-items: center; }
                button { padding: 0.5em 1em; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em; font-weight: 500; transition: background-color 0.2s ease, transform 0.1s ease; white-space: nowrap; }
                button:active { transform: scale(0.96); }
                .share-button { background-color: #17a2b8; color: white; }
                .share-button:hover { background-color: #138496; }
                .qr-button { background-color: #ffc107; color: #333; }
                .qr-button:hover { background-color: #e0a800; }
                .qr-button.active { background-color: #e0a800; }
                .delete-button { background-color: #dc3545; color: white; }
                .delete-button:hover { background-color: #c82333; }
                .share-button[disabled] { display: none; }
                .qr-code-area { margin-top: 1em; padding: 1em; background-color: #fff; border: 1px solid #eee; border-radius: 5px; display: none; /* Controlado por JS */ justify-content: center; align-items: center; }
                .qr-code-area canvas { max-width: 100%; height: auto !important; }
            </style>
            <div class="content-wrapper">
                <div class="link-info">
                    <span class="link-name">${name}</span>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-url" title="Abrir link original em nova aba">${url}</a>
                    <div class="short-link-container">
                        <span>Link curto:</span>
                        <a href="${shortUrlHash}" class="short-link" title="Usar link curto (abre nesta aplicação)">${displayShortUrl}</a>
                    </div>
                </div>
                <div class="actions">
                    <button class="share-button" title="Compartilhar Link Original" ${!canShare ? 'disabled' : ''}>Compartilhar</button>
                    <button class="qr-button" title="Mostrar/Esconder QR Code do Link Original">QR Code</button>
                    <button class="delete-button" title="Excluir Link">Excluir</button>
                </div>
            </div>
            <div class="qr-code-area">
                 <div class="qr-code-canvas"></div>
            </div>
        `;
    }

    _attachEvents() {
        if (!this._linkData) return;
        const deleteButton = this.shadowRoot.querySelector('.delete-button');
        const shareButton = this.shadowRoot.querySelector('.share-button');
        const qrButton = this.shadowRoot.querySelector('.qr-button');
        const qrCodeArea = this.shadowRoot.querySelector('.qr-code-area');
        const qrCanvasContainer = this.shadowRoot.querySelector('.qr-code-canvas');

        deleteButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('delete-link', { detail: { id: this._linkData.id }, bubbles: true, composed: true }));
        });

        if (shareButton && !shareButton.disabled) {
            shareButton.addEventListener('click', async () => {
                try {
                    await navigator.share({ title: this._linkData.name, text: `Confira: ${this._linkData.name}`, url: this._linkData.url });
                } catch (error) { if (error.name !== 'AbortError') { console.error('Erro share:', error);}}
            });
        }

        if (qrButton) {
           qrButton.addEventListener('click', () => {
               if (!qrCodeArea || !qrCanvasContainer) return;
               this._qrVisible = !this._qrVisible;

               if (this._qrVisible) {
                   const originalUrl = this._linkData.url; // URL ORIGINAL AQUI
                   qrCanvasContainer.innerHTML = '';
                   const canvasElement = document.createElement('canvas');
                   qrCanvasContainer.appendChild(canvasElement);

                   try {
                       if (typeof QRious !== 'function') throw new Error("QRious not loaded");
                       this._qrInstance = new QRious({ element: canvasElement, value: originalUrl, size: 150, level: 'H', padding: 10 });
                       qrCodeArea.style.display = 'flex';
                       qrButton.classList.add('active');
                       qrButton.textContent = 'Esconder QR';
                   } catch (e) {
                       console.error(`ERRO QRious:`, e); alert("Não foi possível gerar QR Code."); this._qrVisible = false;
                       qrCodeArea.style.display = 'none'; qrCanvasContainer.innerHTML = ''; qrButton.classList.remove('active'); qrButton.textContent = 'QR Code';
                   }
               } else {
                   qrCodeArea.style.display = 'none'; qrCanvasContainer.innerHTML = ''; this._qrInstance = null;
                   qrButton.classList.remove('active'); qrButton.textContent = 'QR Code';
               }
           });
        }
    }
    connectedCallback() {
        this._qrVisible = false; this._qrInstance = null;
        if (this._linkData && !this.shadowRoot.innerHTML) { this._render(); this._attachEvents(); }
    }
    disconnectedCallback() { this._qrInstance = null; }
}
customElements.define('link-item', LinkItem);