document.addEventListener('DOMContentLoaded', () => {
    // Referências aos componentes personalizados e estado da aplicação
    let linkFormComponent = null;
    let linkListComponent = null;
    const STORAGE_KEY = 'pwa-links'; // Chave para armazenamento local
    let links = []; // Estado da aplicação: lista de links

    // --- Funções de Armazenamento Local ---
    // Carrega os links salvos no localStorage
    function loadLinks() {
        const linksJson = localStorage.getItem(STORAGE_KEY);
        try {
            links = linksJson ? JSON.parse(linksJson) : [];
        } catch (e) {
            console.error('Erro ao carregar links do localStorage:', e);
            links = []; // Reseta em caso de erro de parse
        }
        // Garante que links seja sempre um array
        if (!Array.isArray(links)) {
            links = [];
        }
        console.log('Links carregados:', links);
    }

    // Salva os links no localStorage
    function saveLinks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
            console.log('Links salvos no localStorage.');
        } catch (e) {
            console.error('Erro ao salvar links no localStorage:', e);
            alert('Não foi possível salvar os links. O armazenamento local pode estar cheio ou indisponível.');
        }
    }

    // --- Validação de URL ---
    // Verifica se uma string é uma URL válida com protocolo HTTP/HTTPS
    function isValidHttpUrl(string) {
        let url;
        try {
            url = new URL(string);
        } catch (e) {
            return false;
        }
        const isValidProtocol = url.protocol === "http:" || url.protocol === "https:";
        return isValidProtocol;
    }

    // --- Funções de Manipulação de Links ---
    // Adiciona um novo link à lista
    function addLink(name, url) {
        let trimmedUrl = url.trim();
        let urlToCheck = trimmedUrl;
        let needsProtocolPrepended = !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://');

        if (needsProtocolPrepended) {
            urlToCheck = 'https://' + trimmedUrl; // Tenta https primeiro
        }

        if (isValidHttpUrl(urlToCheck)) {
            // URL válida
        } else {
            if (needsProtocolPrepended) {
                urlToCheck = 'http://' + trimmedUrl; // Tenta http como fallback
                if (!isValidHttpUrl(urlToCheck)) {
                    alert('URL inválida. Por favor, insira uma URL completa (ex: https://exemplo.com).');
                    return;
                }
            } else {
                alert('URL inválida. Por favor, insira uma URL completa e correta (ex: https://exemplo.com).');
                return;
            }
        }

        const finalUrl = urlToCheck;

        // Verificação de Duplicados
        const isDuplicate = links.some(link => link.url === finalUrl);
        if (isDuplicate) {
            alert('Este link já foi adicionado!');
            return;
        }

        // Cria e adiciona o link
        const newLink = {
            id: Date.now().toString(36),
            name: name,
            url: finalUrl
        };
        links.push(newLink);
        saveLinks();
        renderLinkList();
        console.log('[addLink] Link adicionado com sucesso:', newLink);
    }

    // Remove um link da lista pelo ID
    function deleteLink(id) {
        links = links.filter(link => link.id !== id);
        saveLinks();
        renderLinkList();
        console.log('Link excluído:', id);
    }

    // --- Renderização ---
    // Atualiza a lista de links exibida no componente link-list
    function renderLinkList() {
        if (linkListComponent) {
            linkListComponent.displayLinks(links);
        } else {
            console.error('renderLinkList chamada antes de linkListComponent estar pronto.');
        }
    }

    // --- Registro do Service Worker ---
    // Registra o Service Worker para funcionalidades PWA
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js', { scope: '.' }) // Garante escopo correto
                .then(registration => {
                    console.log('Service Worker registrado com sucesso! Escopo:', registration.scope);
                }).catch(error => {
                    console.error('Falha no registro do Service Worker:', error);
                });
        } else {
            console.warn('Service Worker não é suportado neste navegador.');
        }
    }

    // --- Manipulador de Links Curtos ---
    // Redireciona para o link original com base no hash da URL
    function handleHashRedirect() {
        const shortId = window.location.hash.substring(1);
        if (!shortId) return;

        console.log('Tentando redirecionar para short ID:', shortId);
        const targetLink = links.find(link => link.id === shortId);

        if (targetLink) {
            console.log('Encontrado link:', targetLink.url);
            history.replaceState(null, document.title, window.location.pathname + window.location.search); // Limpa hash
            window.open(targetLink.url, '_blank'); // Abre em nova aba
        } else {
            console.warn('ID de link curto não encontrado:', shortId);
            history.replaceState(null, document.title, window.location.pathname + window.location.search); // Limpa hash inválido
        }
    }
    window.addEventListener('hashchange', handleHashRedirect);

    // --- INÍCIO DA LÓGICA DE INICIALIZAÇÃO ---
    registerServiceWorker(); // Registra o Service Worker
    loadLinks(); // Carrega os links salvos

    // Aguarda a definição dos componentes personalizados
    Promise.all([
        customElements.whenDefined('link-form'),
        customElements.whenDefined('link-list')
    ]).then(() => {
        console.log('Componentes link-form e link-list estão definidos e prontos.');

        linkFormComponent = document.querySelector('link-form');
        linkListComponent = document.querySelector('link-list');

        if (!linkFormComponent) {
            console.error('CRÍTICO: link-form definido, mas não encontrado no DOM! Verifique o index.html.');
            return;
        }
        if (!linkListComponent) {
            console.error('CRÍTICO: link-list definido, mas não encontrado no DOM! Verifique o index.html.');
            return;
        }

        linkFormComponent.addEventListener('add-link', (event) => {
            const { name, url } = event.detail;
            addLink(name, url);
        });

        linkListComponent.addEventListener('delete-link', (event) => {
             const linkIdToDelete = event.detail.id;
             if (linkIdToDelete && confirm(`Tem certeza que deseja excluir o link?`)) {
                 deleteLink(linkIdToDelete);
             }
        });

        renderLinkList(); // Primeira renderização
        handleHashRedirect(); // Verifica hash inicial

    }).catch(error => {
        console.error('Erro ao esperar pela definição dos custom elements:', error);
    });
    // --- FIM DA LÓGICA DE INICIALIZAÇÃO ---
});