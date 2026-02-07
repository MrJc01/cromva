# Guia de Contribuição

Obrigado pelo interesse em contribuir com o Cromva OS! 🎉

## Como Contribuir

### 1. Reportar Bugs

Se encontrar um bug, abra uma issue com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Screenshots (se aplicável)

### 2. Sugerir Funcionalidades

Para novas funcionalidades:
- Descreva o caso de uso
- Explique benefícios
- Se possível, sugira implementação

### 3. Código

#### Setup do Ambiente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/cromva.git
cd cromva

# Instale dependências
npm install

# Execute testes
npm test

# Inicie servidor de desenvolvimento
npm run dev
```

#### Estrutura do Projeto

```
cromva/
├── js/
│   ├── core/          # Módulos centrais
│   ├── features/      # Funcionalidades
│   ├── ui/            # Componentes de interface
│   └── utils/         # Utilitários
├── scripts/
│   └── tests/         # Testes automatizados
├── index.html         # Ponto de entrada
└── index.css          # Estilos globais
```

#### Padrões de Código

- **Nomes**: camelCase para variáveis/funções, PascalCase para classes
- **Comentários**: JSDoc para funções públicas
- **Módulos**: Exportar como objeto global (`window.NomeDoModulo`)
- **Eventos**: Usar `CromvaEvents` para comunicação entre módulos

#### Exemplo de Módulo

```javascript
/**
 * Cromva MeuModulo
 * Descrição do módulo
 */

const MeuModulo = {
    /**
     * Inicializa o módulo
     */
    init() {
        console.log('[MeuModulo] Initialized');
    },

    /**
     * Faz algo útil
     * @param {string} param - Descrição
     * @returns {boolean} Sucesso
     */
    fazerAlgo(param) {
        // Implementação
        return true;
    }
};

// Export global
window.MeuModulo = MeuModulo;
```

### 4. Testes

- Adicione testes para novas funcionalidades
- Execute `npm test` antes de submeter
- Mantenha cobertura >80%

### 5. Pull Requests

1. Fork o repositório
2. Crie branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra PR com descrição detalhada

#### Convenção de Commits

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## Código de Conduta

- Seja respeitoso
- Aceite feedback construtivo
- Foque no problema, não na pessoa

## Dúvidas?

Abra uma issue ou entre em contato!

---

Obrigado por contribuir! 💚
