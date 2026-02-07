# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [1.0.0] - 2026-02-05

### Adicionado
- **34 novos módulos** de funcionalidade
- Sistema de **persistência IndexedDB** para handles de arquivo
- **Modo offline** com queue de sincronização
- **Tour de onboarding** para novos usuários
- **Debug panel** (Ctrl+Shift+D)
- **Undo/Redo** (Ctrl+Z/Y)
- **Busca e substituição** (Ctrl+F/H) com suporte a regex
- **Modo foco/zen** (Ctrl+Shift+F)
- **Favoritos** para notas
- **Multi-seleção** de arquivos (Ctrl+A)
- **Drag-drop de imagens** no editor
- **5 temas** customizáveis (Dark, Midnight, Forest, Light, High Contrast)
- **Preview de arquivos** on hover
- **Breadcrumb** de navegação
- **Contador de linhas** com estatísticas
- **Toolbar markdown** com formatação rápida
- **Menu de contexto** (right-click)
- **Ordenação** por nome/data/tamanho
- **Busca/filtro** de notas e arquivos
- **Exportação/importação** de dados em JSON
- **Locais recentes** no location picker
- **Indicador de conexão** online/offline
- **Animações CSS** suaves
- **177 testes automatizados** com Playwright

### Alterado
- Refatoração completa da arquitetura de módulos
- Event bus centralizado para comunicação entre componentes
- Configurações centralizadas em `config.js`

### Corrigido
- Perda de handles de arquivo após reload do navegador
- Duplicação de scripts no HTML
- Validação de nomes de arquivo

## [0.9.0] - 2026-02-04

### Adicionado
- Estrutura base do Cromva OS
- Editor Markdown com preview
- Sistema de workspaces
- Visualização em grafo
- Infinite canvas
- Spotlight search
- Sistema de configurações

---

Para mais detalhes, veja o [README.md](README.md).
