document.addEventListener('DOMContentLoaded', () => {
    // Variáveis para armazenar referências aos componentes (serão preenchidas depois)
    let linkFormComponent = null;
    let linkListComponent = null;
    const STORAGE_KEY = 'pwa-links';
    let links = []; // Nosso estado da aplicação

    // --- Funções de Armazenamento Local ---

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
    function isValidHttpUrl(string) {
        let url;
        // console.log(`[isValidHttpUrl] Validando string: "${string}"`);
        try {
            url = new URL(string);
            // console.log(`[isValidHttpUrl] URL parseada com sucesso. Protocolo: "${url.protocol}"`);
        } catch (e) {
            // console.warn(`[isValidHttpUrl] Falha ao parsear URL: ${e.message}`);
            return false;
        }
        const isValidProtocol = url.protocol === "http:" || url.protocol === "https:";
        // console.log(`[isValidHttpUrl] Protocolo é http ou https? ${isValidProtocol}`);
        return isValidProtocol;
    }


    // --- Funções de Manipulação de Links ---
    function addLink(name, url) {
        // console.log(`[addLink] Recebido: name="${name}", url="${url}"`);
        let trimmedUrl = url.trim();
        // console.log(`[addLink] URL após trim: "${trimmedUrl}"`);

        let urlToCheck = trimmedUrl;
        let needsProtocolPrepended = !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://');
        // console.log(`[addLink] Precisa adicionar protocolo? ${needsProtocolPrepended}`);

        if (needsProtocolPrepended) {
            urlToCheck = 'https://' + trimmedUrl; // Tenta https primeiro
            // console.log(`[addLink] Tentando com https:// : "${urlToCheck}"`);
        }

        // console.log(`[addLink] Realizando 1ª validação em: "${urlToCheck}"`);
        if (isValidHttpUrl(urlToCheck)) {
            // console.log(`[addLink] 1ª validação OK.`);
        } else {
            // console.warn(`[addLink] 1ª validação FALHOU.`);
            if (needsProtocolPrepended) {
                urlToCheck = 'http://' + trimmedUrl; // Tenta http como fallback
                // console.log(`[addLink] Tentando com http:// : "${urlToCheck}"`);
                // console.log(`[addLink] Realizando 2ª validação em: "${urlToCheck}"`);
                if (!isValidHttpUrl(urlToCheck)) {
                    console.error(`[addLink] 2ª validação (com http://) FALHOU.`);
                    alert('URL inválida. Por favor, insira uma URL completa (ex: https://exemplo.com).');
                    return;
                }
                // console.log(`[addLink] 2ª validação OK.`);
            } else {
                 console.error(`[addLink] URL original ("${trimmedUrl}") parece ter protocolo mas falhou na validação.`);
                 alert('URL inválida. Por favor, insira uma URL completa e correta (ex: https://exemplo.com).');
                 return;
            }
        }

        const finalUrl = urlToCheck;
        // console.log(`[addLink] URL final a ser usada: "${finalUrl}"`);

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

    function deleteLink(id) {
        links = links.filter(link => link.id !== id);
        saveLinks();
        renderLinkList();
        console.log('Link excluído:', id);
    }

    // --- Renderização ---
    function renderLinkList() {
        if (linkListComponent) {
            linkListComponent.displayLinks(links);
        } else {
            console.error('renderLinkList chamada antes de linkListComponent estar pronto.');
        }
    }

    // --- Registro do Service Worker ---
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js', { scope: '.' }) // Garante escopo correto
                .then(registration => {
                    console.log('Service Worker registrado com sucesso! Escopo:', registration.scope);
                    // Lógica de atualização opcional...
                }).catch(error => {
                    console.error('Falha no registro do Service Worker:', error);
                });
        } else {
            console.warn('Service Worker não é suportado neste navegador.');
        }
    }

    // --- Manipulador de Links Curtos (Simulado) ---
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
    registerServiceWorker();
    loadLinks();

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

}); // Fim do DOMContentLoaded