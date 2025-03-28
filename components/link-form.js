class LinkForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._render();
        this._attachEvents();
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-bottom: 1.5em;
                    padding: 1em;
                    border: 1px solid #eee;
                    border-radius: 5px;
                    background-color: #fff;
                }
                form {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.8em;
                    align-items: center;
                }
                label { display: none; }
                input[type="text"], input[type="url"] {
                    flex-grow: 1;
                    padding: 0.6em;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 1em;
                    min-width: 150px;
                }
                 input::placeholder { color: #aaa; }
                button {
                    padding: 0.7em 1.3em;
                    border: none;
                    border-radius: 4px;
                    background-color: #28a745; /* Verde */
                    color: white;
                    font-size: 1em;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                button:hover { background-color: #218838; }
            </style>
            <form id="link-form">
                <label for="link-name">Nome:</label>
                <input type="text" id="link-name" name="name" placeholder="Nome do Link" required>

                <label for="link-url">URL:</label>
                <input type="url" id="link-url" name="url" placeholder="https://exemplo.com" required>

                <button type="submit">Adicionar Link</button>
            </form>
        `;
    }

    _attachEvents() {
        const form = this.shadowRoot.getElementById('link-form');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const nameInput = this.shadowRoot.getElementById('link-name');
            const urlInput = this.shadowRoot.getElementById('link-url');
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();

            if (name && url) {
                this.dispatchEvent(new CustomEvent('add-link', {
                    detail: { name, url },
                    bubbles: true,
                    composed: true
                }));
                form.reset();
                nameInput.focus();
            }
        });
    }

    connectedCallback() { }
    disconnectedCallback() { }
}
customElements.define('link-form', LinkForm);