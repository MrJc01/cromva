# Cromva - Arquitetura de Workspaces

## Conceito Principal

Um **Workspace** é um **agregador** de diferentes fontes de dados, não uma fonte única.

### Estrutura de um Workspace

```
Workspace
├── Virtual Storage (localStorage)      ← Notas criadas na memória
├── System Folders/Files (File API)     ← Pastas vinculadas do sistema
└── [Futuro] Cloud/APIs                 ← Integrações externas
```

### Modelo de Dados

```javascript
// Workspace NÃO tem "isLocal" - ele é sempre híbrido
{
    id: 123,
    name: "Meu Projeto",
    desc: "Descrição do workspace",
    color: "blue",
    date: "2026-02-05T10:00:00Z"
}

// Cada ARQUIVO/PASTA tem sua origem
{
    id: 456,
    name: "documento.md",
    type: "file",
    source: "localStorage" | "filesystem" | "cloud",  // ORIGEM
    handle: FileSystemHandle | null,  // Se veio do sistema
    content: "...",
    date: "..."
}
```

### Exemplo Visual

```
📁 Workspace "Desenvolvimento"
├── 📂 Virtual (localStorage)
│   └── 📄 Ideias.md
├── 📂 /home/user/projetos/app
│   ├── 📄 README.md
│   └── 📄 CHANGELOG.md
└── 📂 Google Drive (futuro)
    └── 📄 Compartilhado.md
```

## Regras de Implementação

1. **Workspace nunca é "local"** - ele agrega múltiplas fontes
2. **Cada item tem sua origem** - no campo `source`
3. **Handles são por arquivo/pasta** - não por workspace
4. **FSHandler.handles** armazena handles por ID do arquivo
