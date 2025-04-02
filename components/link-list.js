class LinkList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Cria Shadow DOM
        this._render(); // Renderiza o contêiner da lista
    }

    // Renderiza o HTML do contêiner da lista
    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                h2 { margin-top: 0; color: #555; border-bottom: 1px solid #eee; padding-bottom: 0.5em; font-size: 1.3em; }
                #list-container { border: 1px solid #eee; border-radius: 5px; overflow: hidden; background-color: #fff; }
                #empty-message { padding: 1.5em; text-align: center; color: #777; font-style: italic; display: none; } /* Começa escondido */
                 #list-container > link-item:last-child { border-bottom: none; }
            </style>
            <h2>Links Salvos</h2>
            <div id="list-container">
                <div id="empty-message">Nenhum link salvo ainda.</div>
            </div>
        `;
    }

    // Exibe os links na lista ou uma mensagem vazia
    displayLinks(links = []) {
        const container = this.shadowRoot.getElementById('list-container');
        const emptyMessage = this.shadowRoot.getElementById('empty-message');

        // Limpa APENAS os link-item anteriores
        const currentItems = container.querySelectorAll('link-item');
        currentItems.forEach(item => container.removeChild(item));

        if (!links || links.length === 0) {
            emptyMessage.style.display = 'block'; // Mostra mensagem
        } else {
            emptyMessage.style.display = 'none'; // Esconde mensagem
            links.forEach(linkData => {
                const linkElement = document.createElement('link-item');
                linkElement.link = linkData;
                container.appendChild(linkElement);
            });
        }
    }

    connectedCallback() { }
    disconnectedCallback() { }
}
customElements.define('link-list', LinkList);