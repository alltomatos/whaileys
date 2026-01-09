import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  proto
} from "../src";

const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === "open") {
      console.log("opened connection");

      const jid = "1234567890@s.whatsapp.net"; // Substitua pelo JID de destino

      // 1. Botões Simples
      await sock.sendMessage(jid, {
        text: "Escolha uma opção:",
        footer: "Whaileys",
        buttons: [
          { buttonId: "btn1", buttonText: { displayText: "Opção 1" } },
          { buttonId: "btn2", buttonText: { displayText: "Opção 2" } }
        ],
        headerType: 1
      });

      // 2. Botões de Template
      await sock.sendMessage(jid, {
        text: "Template Buttons:",
        footer: "Whaileys",
        templateButtons: [
          {
            index: 1,
            urlButton: {
              displayText: "Visite o site",
              url: "https://github.com/alltomatos/whaileys"
            }
          },
          {
            index: 2,
            callButton: {
              displayText: "Ligar",
              phoneNumber: "+5511999999999"
            }
          },
          {
            index: 3,
            quickReplyButton: {
              displayText: "Resposta Rápida",
              id: "quick_reply_1"
            }
          }
        ]
      });

      // 3. List Message
      await sock.sendMessage(jid, {
        text: "Selecione um item da lista:",
        footer: "Whaileys",
        title: "Menu Principal",
        buttonText: "Ver Menu",
        sections: [
          {
            title: "Seção 1",
            rows: [
              { title: "Opção A", rowId: "opt_a", description: "Descrição A" },
              { title: "Opção B", rowId: "opt_b", description: "Descrição B" }
            ]
          },
          {
            title: "Seção 2",
            rows: [
              { title: "Opção C", rowId: "opt_c" }
            ]
          }
        ]
      });

      // 4. Interactive Message (Native Flow)
      // Este formato é mais complexo e requer construção manual do proto
      const msg: proto.Message.IInteractiveMessage = {
        body: { text: "Mensagem Interativa Nativa" },
        footer: { text: "Whaileys" },
        header: {
          title: "Cabeçalho",
          subtitle: "Subtítulo",
          hasMediaAttachment: false
        },
        nativeFlowMessage: {
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "Botão Nativo 1",
                id: "native_btn_1"
              })
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Abrir Link",
                url: "https://google.com",
                merchant_url: "https://google.com"
              })
            }
          ]
        }
      };

      await sock.sendMessage(jid, {
        interactiveMessage: msg
      });
    }
  });

  sock.ev.on("creds.update", saveCreds);
};

startSock();
