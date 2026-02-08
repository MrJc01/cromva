# Cromva

> 🗒️ Aplicativo de Notas Moderno com Suporte a Desktop e Web

[![Versão](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/MrJc01/cromva)
[![Licença](https://img.shields.io/badge/license-Proprietária-red.svg)](LICENSE)

## ✨ Funcionalidades

- 📝 **Editor Markdown** — Suporte completo com preview em tempo real
- 📂 **Integração com Sistema de Arquivos** — Conecte pastas locais (Web: File System API, Desktop: Tauri)
- 🔍 **Spotlight Search** — Busca rápida com `Ctrl+K`
- 📊 **Visualização em Grafo** — Veja conexões entre notas
- 🎨 **Canvas Infinito** — Organize notas espacialmente
- 💾 **Auto-sync** — Salvamento automático
- 📦 **Export/Import** — Backup de workspaces em ZIP
- 📈 **Analytics** — Estatísticas de produtividade

## 🚀 Início Rápido

### Requisitos

- **Web**: Navegador moderno (Chrome, Edge)
- **Desktop**: [Rust](https://rustup.rs/) + Node.js 18+

### Instalação

```bash
# Clonar repositório
git clone https://github.com/MrJc01/cromva.git
cd cromva

# Instalar dependências
npm install
```

### Executar

```bash
# Modo Web (Vite dev server)
npm run serve
# Abrir http://localhost:8080

# Modo Desktop (Tauri)
npm run dev
```

### Build para Produção

```bash
# Gerar executáveis Desktop + Web
npm run build
```

## 📁 Estrutura do Projeto

```
cromva/
├── app/                    # Código-fonte principal
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── core/           # Módulos core (state, fs_handler)
│       ├── features/       # Features (editor, workspaces, canvas)
│       ├── ui/             # Componentes UI
│       └── utils/          # Utilitários
├── src-tauri/              # Backend Tauri (Rust)
│   ├── tauri.conf.json
│   └── src/
├── scripts/                # Testes e ferramentas
├── vite.config.mjs         # Configuração Vite
└── package.json
```

## 🏗️ Arquitetura

### Hybrid Deployment

O Cromva roda tanto na **Web** quanto como **App Desktop**:

| Feature | Web | Desktop (Tauri) |
|---------|-----|-----------------|
| Armazenamento | localStorage + OPFS | Sistema de arquivos nativo |
| Offline | Service Worker | Sempre offline |
| Performance | Boa | Excelente |
| Instalação | Não requer | Instalador (.exe, .deb, .dmg) |

### Bridge Pattern

```javascript
// Detectar ambiente
if (FSHandler.isTauri()) {
    // Usar APIs nativas via window.Tauri
} else {
    // Usar File System Access API do navegador
}
```

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Com browser visível
npm run test:headed

# Modo debug
npm run test:debug
```

## 📜 Licença

Este software é propriedade de **Crom.run**. Veja [LICENSE](LICENSE) para detalhes.

---

Feito com ❤️ pela equipe Crom.run
