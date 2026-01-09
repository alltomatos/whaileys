# Mensagens Interativas no Whaileys

Este documento descreve como utilizar as funcionalidades de mensagens interativas suportadas pelo Whaileys, incluindo Botões, Listas e Mensagens Interativas Nativas (Native Flow).

> **Nota:** Para garantir o funcionamento correto no WhatsApp Web e Multi-Device, o Whaileys aplica automaticamente um patch (`viewOnceMessage` com `deviceListMetadata`) ao enviar esses tipos de mensagem.

## 1. Botões Simples (Plain Buttons)

Utilize botões simples para oferecer opções rápidas de resposta.

### Envio

```typescript
await sock.sendMessage(jid, {
    text: 'Escolha uma opção:',
    footer: 'Whaileys',
    buttons: [
        { buttonId: 'id_btn_1', buttonText: { displayText: 'Opção 1' } },
        { buttonId: 'id_btn_2', buttonText: { displayText: 'Opção 2' } },
        { buttonId: 'id_btn_3', buttonText: { displayText: 'Opção 3' } }
    ],
    headerType: 1 // 1 = Texto apenas
});
```

### Recebimento (Resposta)

A resposta chega em `message.buttonsResponseMessage`.

```typescript
if (msg.message?.buttonsResponseMessage) {
    const response = msg.message.buttonsResponseMessage;
    console.log('Botão selecionado:', response.selectedButtonId);
    console.log('Texto do botão:', response.selectedDisplayText);
}
```

---

## 2. Botões de Template (Template Buttons)

Botões de template permitem ações mais ricas, como abrir URLs, realizar chamadas telefônicas ou respostas rápidas.

### Envio

```typescript
await sock.sendMessage(jid, {
    text: 'Olá! Como podemos ajudar?',
    footer: 'Whaileys',
    templateButtons: [
        {
            index: 1,
            urlButton: {
                displayText: 'Visite nosso site',
                url: 'https://github.com/alltomatos/whaileys'
            }
        },
        {
            index: 2,
            callButton: {
                displayText: 'Ligar para suporte',
                phoneNumber: '+5511999999999'
            }
        },
        {
            index: 3,
            quickReplyButton: {
                displayText: 'Falar com atendente',
                id: 'btn_atendente'
            }
        }
    ]
});
```

### Recebimento (Resposta)

Para `quickReplyButton`, a resposta chega em `message.templateButtonReplyMessage`. Botões de URL e Call executam ações no dispositivo do usuário e não geram uma resposta direta de chat.

```typescript
if (msg.message?.templateButtonReplyMessage) {
    const response = msg.message.templateButtonReplyMessage;
    console.log('ID selecionado:', response.selectedId);
    console.log('Texto:', response.selectedDisplayText);
}
```

---

## 3. Listas (List Messages)

Ideais para apresentar muitas opções organizadas em seções.

### Envio

```typescript
await sock.sendMessage(jid, {
    text: 'Selecione um produto:',
    footer: 'Loja Whaileys',
    title: 'Catálogo',
    buttonText: 'Ver Produtos',
    sections: [
        {
            title: 'Eletrônicos',
            rows: [
                { title: 'Mouse Gamer', rowId: 'prod_001', description: 'Alta precisão' },
                { title: 'Teclado Mecânico', rowId: 'prod_002', description: 'Switch Blue' }
            ]
        },
        {
            title: 'Acessórios',
            rows: [
                { title: 'Mousepad', rowId: 'prod_003' }
            ]
        }
    ]
});
```

### Recebimento (Resposta)

A resposta chega em `message.listResponseMessage`.

```typescript
if (msg.message?.listResponseMessage) {
    const response = msg.message.listResponseMessage;
    const selectedRowId = response.singleSelectReply?.selectedRowId;
    console.log('Item selecionado:', selectedRowId);
}
```

---

## 4. Mensagens Interativas (Native Flow)

O formato mais moderno e flexível, suportando fluxos complexos e layouts nativos. É construído manualmente através do objeto `interactiveMessage`.

### Envio

```typescript
const { proto } = require('@whiskeysockets/baileys'); // ou seu import local

const msg = {
    interactiveMessage: {
        body: { text: "Mensagem com Fluxo Nativo" },
        footer: { text: "Whaileys Native" },
        header: {
            title: "Título do Header",
            subtitle: "Subtítulo",
            hasMediaAttachment: false
        },
        nativeFlowMessage: {
            buttons: [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Botão Azul",
                        id: "native_btn_blue"
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Abrir Google",
                        url: "https://google.com",
                        merchant_url: "https://google.com"
                    })
                }
            ]
        }
    }
};

await sock.sendMessage(jid, { interactiveMessage: msg.interactiveMessage });
```

### Recebimento (Resposta)

A resposta chega em `message.interactiveResponseMessage`. O payload do botão clicado geralmente vem serializado em JSON dentro de `nativeFlowResponseMessage`.

```typescript
if (msg.message?.interactiveResponseMessage) {
    const response = msg.message.interactiveResponseMessage;
    const body = response.body; // Texto do botão clicado (às vezes)
    
    if (response.nativeFlowResponseMessage) {
        const nativeFlow = response.nativeFlowResponseMessage;
        console.log('Nome do botão:', nativeFlow.name);
        
        const params = JSON.parse(nativeFlow.paramsJson);
        console.log('ID do botão:', params.id);
    }
}
```

## Resumo de Tipos de Resposta

| Tipo de Envio | Tipo de Resposta (`msg.message.X`) | Campo Chave |
| :--- | :--- | :--- |
| `buttons` | `buttonsResponseMessage` | `selectedButtonId` |
| `templateButtons` | `templateButtonReplyMessage` | `selectedId` |
| `sections` (Lista) | `listResponseMessage` | `singleSelectReply.selectedRowId` |
| `interactiveMessage` | `interactiveResponseMessage` | `nativeFlowResponseMessage.paramsJson` |
