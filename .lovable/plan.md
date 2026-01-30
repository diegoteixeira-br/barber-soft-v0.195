
# Plano: Senha de Seguranca para Exclusao de Agendamentos

## Objetivo

Implementar uma senha de seguranca definida pelo dono da barbearia que sera exigida antes de excluir agendamentos confirmados ou finalizados. Isso protege o fluxo financeiro contra exclusoes nao autorizadas por colaboradores (profissionais).

## Por Que Isso e Importante?

O dono da barbearia compartilha acesso ao sistema com os profissionais, mas precisa garantir que apenas pessoas autorizadas possam excluir registros que impactam o caixa. Uma senha separada garante essa camada extra de seguranca.

## Como Vai Funcionar

```text
Profissional clica em "Excluir" agendamento
        |
        v
Sistema verifica se agendamento e confirmado/finalizado
        |
        v
  [SIM] --> Modal solicita senha de exclusao
        |
        v
Senha correta? --> Prossegue com exclusao
        |
  [NAO] --> Mensagem de erro "Senha incorreta"
```

## Onde o Dono Configura a Senha

Na aba **Conta** em Configuracoes, sera adicionado um novo card:

| Campo | Descricao |
|-------|-----------|
| Senha de Exclusao | Senha numerica de 4-6 digitos |
| Confirmar Senha | Confirmacao da senha |
| Habilitar/Desabilitar | Toggle para ativar a protecao |

## Seguranca da Senha

A senha sera armazenada de forma segura no banco de dados, em uma coluna separada na tabela `business_settings`. 

**Importante:** A validacao acontecera **no frontend** comparando com o hash da senha. Para maior seguranca, poderiamos criar uma edge function, mas para simplicidade e velocidade, faremos a validacao local usando bcrypt/hash.

**Abordagem simplificada:** Armazenar a senha com hash SHA-256 e comparar no frontend. Nao e tao seguro quanto bcrypt, mas impede que alguem veja a senha em texto claro.

## Mudancas Necessarias

### 1. Banco de Dados

Adicionar colunas na tabela `business_settings`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `deletion_password_hash` | TEXT | Hash da senha de exclusao |
| `deletion_password_enabled` | BOOLEAN | Se a protecao esta ativa |

### 2. Hook useBusinessSettings

Atualizar interface e funcoes para incluir os novos campos:
- `deletion_password_enabled`
- Funcao `setDeletionPassword(password)` que gera hash e salva
- Funcao `verifyDeletionPassword(password)` que compara hashes

### 3. AccountTab (Configuracoes)

Adicionar novo card de "Senha de Exclusao":
- Input para nova senha (mascarado)
- Input para confirmar senha
- Toggle para ativar/desativar
- Botao para salvar

### 4. AppointmentDetailsModal

Modificar o fluxo de exclusao:
1. Quando clicar em Excluir (agendamento confirmado/finalizado)
2. Se `deletion_password_enabled` estiver ativo:
   - Mostrar campo de senha antes do motivo
   - Validar senha antes de permitir exclusao
3. Se senha incorreta, mostrar erro e bloquear

### 5. Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Adicionar colunas `deletion_password_hash` e `deletion_password_enabled` |
| `useBusinessSettings.ts` | Adicionar interfaces e funcoes para senha |
| `AccountTab.tsx` | Novo card para configurar senha de exclusao |
| `AppointmentDetailsModal.tsx` | Adicionar validacao de senha antes de excluir |

## Interface do Usuario

### Card de Configuracao (AccountTab)

```text
+---------------------------------------------+
| [Icone Cadeado] Senha de Exclusao           |
| Proteja a exclusao de agendamentos          |
+---------------------------------------------+
| [Toggle] Exigir senha para excluir          |
|                                             |
| Nova Senha:    [........]                   |
| Confirmar:     [........]                   |
|                                             |
| [Salvar Senha]                              |
+---------------------------------------------+
```

### Modal de Exclusao com Senha

```text
+---------------------------------------------+
| [!] Exclusao com Registro                   |
| Este agendamento ja foi confirmado.         |
+---------------------------------------------+
|                                             |
| Senha de Exclusao: [........]               |
|                                             |
| Motivo da exclusao (obrigatorio):           |
| +---------------------------------------+   |
| |                                       |   |
| +---------------------------------------+   |
|                                             |
| [Cancelar]          [Confirmar Exclusao]    |
+---------------------------------------------+
```

## Fluxo Detalhado

1. **Dono configura senha:**
   - Acessa Configuracoes → Conta
   - Ativa toggle "Exigir senha para excluir"
   - Define senha numerica de 4-6 digitos
   - Sistema gera hash e salva no banco

2. **Profissional tenta excluir:**
   - Clica no botao Excluir em agendamento confirmado
   - Sistema detecta que senha esta habilitada
   - Exibe campo de senha + campo de motivo
   - Profissional digita senha
   - Sistema valida hash
   - Se correto: prossegue com exclusao
   - Se incorreto: mostra erro, bloqueia

## Detalhes Tecnicos

### Migracao SQL

```sql
ALTER TABLE public.business_settings 
  ADD COLUMN deletion_password_hash TEXT,
  ADD COLUMN deletion_password_enabled BOOLEAN DEFAULT false;
```

### Geracao de Hash (useBusinessSettings)

Usaremos a Web Crypto API nativa do navegador para gerar hash SHA-256:

```typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Validacao de Senha

```typescript
async function verifyDeletionPassword(inputPassword: string): Promise<boolean> {
  if (!settings?.deletion_password_enabled || !settings?.deletion_password_hash) {
    return true; // Nao precisa validar
  }
  const inputHash = await hashPassword(inputPassword);
  return inputHash === settings.deletion_password_hash;
}
```

### AppointmentDetailsModal

Novo state e logica:
- `deletionPassword`: string para input
- `passwordError`: boolean para mostrar erro
- Validar senha antes de chamar `onDelete(reason)`
