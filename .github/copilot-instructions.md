# Safira UI — Copilot Instructions

## Contexto do projeto

- Projeto frontend `Safira` para automação de notas fiscais.
- Foco de UX: desktop, layout data-heavy (estilo planilha), alta densidade de informação.
- Língua da interface: português-BR.

## Stack e ambiente

- Next.js App Router + TypeScript strict.
- Mantine para componentes de interface.
- Tailwind para utilitários de layout.
- TanStack Query para server state.
- React Hook Form + Zod para formulários e validação.
- Lucide React para ícones.
- Node via `nvm`, versão esperada em `.nvmrc` (`20.19.0`).

## Estrutura esperada

- `src/app`: rotas e layouts.
- `src/components`: componentes visuais e por domínio.
- `src/hooks`: hooks de query/mutation e hooks utilitários.
- `src/services`: contratos, mocks/chamadas de dados, parse/import.

## Rotas principais

- `/dashboard`
- `/postos`
- `/status-automacao`
- `/cadastros`
- `/relatorios`
- `/login`

## Padrões de UI

- Manter padrão minimalista sem excesso de espaçamento.
- Tabelas devem usar o componente compartilhado `DataTable`.
- Filtros devem usar `TableFilters` quando aplicável.
- Notificações de ação/erro/sucesso: `@mantine/notifications`.
- Evitar introduzir novos estilos hardcoded fora da paleta já usada no projeto.

## Domínio de Postos (EC)

Ao editar fluxo de postos, preservar estes campos:

- `cnpjEc`
- `nomeEc`
- `codEc`
- `rede`
- `tipo`: `AUTOMAÇÃO | SEMI-AUTOMAÇÃO`
- `dataConclusao`
- `status`: `AGUARDANDO | EM ANDAMENTO | FINALIZADO`
- `dataClienteAtivado`
- `contato`
- `observacao`

Regras importantes:

- Validar `cnpjEc` no formato `00.000.000/0000-00`.
- Import CSV deve ser resiliente a erro de formatação e manter feedback ao usuário.

## Dados e estado

- Toda leitura/mutação deve passar por hooks em `src/hooks/use-safira-data.ts`.
- Ao alterar postos, invalidar queries relacionadas (`postos`, `dashboard` e redes de postos quando aplicável).
- Preferir updates incrementais e manter compatibilidade dos tipos em `src/services/types.ts`.

## Autenticação/RBAC (base atual)

- Existe base de `middleware` + provider de auth para evolução de RBAC.
- Não remover essa estrutura ao implementar novas features.

## Boas práticas para contribuições

- Utilize as praticas de DRY (Don't Repeat Yourself) e KISS (Keep It Simple, Stupid).
- Faça mudanças cirúrgicas e consistentes com o padrão existente.
- Não criar componentes duplicados se já houver componente compartilhado.
- Manter nomes de campos e labels alinhados ao domínio fiscal atual.
- Sempre validar com build (`npm run build`) após alterações relevantes.
