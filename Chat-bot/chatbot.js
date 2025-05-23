const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const client = new Client();
const delay = ms => new Promise(res => setTimeout(res, ms));

// Carregar o conteúdo do arquivo imagens.json
const imagensData = JSON.parse(fs.readFileSync('imagens.json', 'utf8'));

// Armazena mensagens e detalhes dos contatos
let conversas = {};
let contatos = {};

// Servir arquivos estáticos (CSS e JS)
app.use(express.static(__dirname));

// Página principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Função para enviar áudio como se fosse gravado na hora
async function enviarAudioComoVoz(numero, nomeArquivo) {
    try {
        const caminhoDoArquivo = `./audio/${nomeArquivo}`;
        const audioBuffer = fs.readFileSync(caminhoDoArquivo);
        const base64Audio = audioBuffer.toString('base64');
        const media = new MessageMedia('audio/ogg; codecs=opus', base64Audio, nomeArquivo);

        await client.sendMessage(numero, media, { sendAudioAsVoice: true });
        console.log(`Áudio enviado como gravado na hora para ${numero}`);
    } catch (error) {
        console.error('Erro ao enviar áudio:', error);
    }
}
// Função para enviar figurinhas
async function enviarFigurinha(numero, url) {
    try {
        const media = await MessageMedia.fromUrl(url);
        await client.sendMessage(numero, media, { sendMediaAsSticker: true });
        console.log(`Figurinha enviada para ${numero}`);
    } catch (error) {
        console.error('Erro ao enviar figurinha:', error);
    }
}


// Quando o bot recebe uma mensagem, adiciona ao histórico e busca detalhes do contato
client.on('message', async msg => {
    console.log(`Mensagem recebida de ${msg.from}: ${msg.body}`);

    const contato = await msg.getContact();
    const nomeContato = contato.pushname || "Contato Desconhecido";
    let fotoPerfil = "";

    try {
        const foto = await contato.getProfilePicUrl();
        fotoPerfil = foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    } catch (error) {
        fotoPerfil = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    if (!conversas[msg.from]) {
        conversas[msg.from] = [];
    }

    if (!contatos[msg.from]) {
        contatos[msg.from] = { nome: nomeContato, foto: fotoPerfil };
    }

    let mensagemFormatada = { sender: "cliente", text: msg.body };

    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        mensagemFormatada = {
            sender: "cliente",
            type: msg.type,
            mimetype: media.mimetype,
            data: `data:${media.mimetype};base64,${media.data}`
        };
    }

    conversas[msg.from].push(mensagemFormatada);
    io.emit('atualizarConversas', { conversas, contatos });

    // ---- INTEGRAÇÃO COM RESPOSTAS AUTOMÁTICAS POR PALAVRA-CHAVE ----

    const mensagemUsuario = msg.body.toLowerCase(); // Converte para minúsculas para facilitar a comparação

    // Defina um objeto com palavras-chave e respostas
    const respostasChave = {
        "garantia": "é meu trabalho bb, eu levo a sério, não precisa preocupar",
        "casada": "eu sou solteira amorzinho",
        "solteira": "tô solteira amor, soltinha",
        "cidade": "sou de são jose do rio preto bb",
        "idade": "tenho 27 aninhos amor, e vc?",
    };

    // Verifica se a mensagem contém pelo menos uma palavra-chave e responde mencionando
    for (const palavra in respostasChave) {
        if (mensagemUsuario.includes(palavra)) {
            const resposta = respostasChave[palavra];

            // Simular digitando antes de responder
            const chat = await msg.getChat();
            await delay(90000)
            await chat.sendStateTyping();
            await delay(20000); // Ajuste o delay conforme necessário

            // Responder mencionando a mensagem original
            await msg.reply(resposta);
            console.log(`Palavra-chave detectada: ${palavra} | Resposta enviada para ${msg.from}`);

            return; // Garante que apenas uma resposta seja enviada por mensagem
        }
    }
});



// Iniciar servidor web na porta 9000
server.listen(9003, () => {
    console.log('Painel rodando em http://localhost:9003');
});

// QR Code para conectar
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// Inicializa o cliente
client.initialize();

// Armazenando o último tempo de resposta
let lastMessageTime = {};
let hasStarted = {};

client.on('message', async msg => {
    const currentTime = new Date().getTime();
    const clientNumber = msg.from;

    if (lastMessageTime[clientNumber] && currentTime - lastMessageTime[clientNumber] < 60000) {
        return;
    }

    lastMessageTime[clientNumber] = currentTime;

    if (!hasStarted[clientNumber]) {
        hasStarted[clientNumber] = true;

        await delay(20000);
        const chat = await msg.getChat();
        
        // Usando 'sendStateRecording' no lugar de 'sendStateTyping'
        await chat.sendStateRecording();
        await delay(10000);

        // Áudio 1
        await enviarAudioComoVoz(msg.from, 'Oi amor.ogg');

        // Áudio 2
        await chat.sendStateRecording();
        await delay(15000);
        await enviarAudioComoVoz(msg.from, 'Fantasias.ogg');
        await delay(70000);

        // Áudio 3
        await chat.sendStateRecording();
        await delay(20000);
        await enviarAudioComoVoz(msg.from, 'eu gosto.ogg');
        await delay(2000);
        const figurinhaUrl = 'https://i.ibb.co/4ZwfFFbk/download.webp';
        await enviarFigurinha(msg.from, figurinhaUrl);
        await delay(7000);
        

        // Áudio 4
        await chat.sendStateRecording();
        await delay(10000);
        await enviarAudioComoVoz(msg.from, 'quer ver.ogg');
        await delay(30000);

        try {
            const media1 = await MessageMedia.fromUrl(imagensData.images[0].url);
            const media2 = await MessageMedia.fromUrl(imagensData.images[1].url);
            const media3 = await MessageMedia.fromUrl(imagensData.images[2].url);
            const texto1 = imagensData.text_1_2;
            const texto2 = imagensData.text_3;

            await delay(120000);
            await chat.sendStateTyping();
            await delay(10000);
            await client.sendMessage(msg.from, media1);
            await client.sendMessage(msg.from, media2);
            await chat.sendStateRecording();
            await enviarAudioComoVoz(msg.from, 'amostra.ogg');
            await delay(60000);
            await chat.sendStateTyping();
            await delay(10000);
            await client.sendMessage(msg.from, texto2);
            await client.sendMessage(msg.from, media3);
            await delay(90000);
        } catch (error) {
            console.error("Erro ao enviar imagens:", error);
            await client.sendMessage(msg.from, "só um momentinho bb");
        }

        await chat.sendStateRecording(); 
        await enviarAudioComoVoz(msg.from, 'quer ver mais de mim.ogg');

        await chat.sendStateRecording();
        await delay(20000);
        await enviarAudioComoVoz(msg.from, '20 reais.ogg');
        
        await chat.sendStateRecording();
        await delay(15000);
        await enviarAudioComoVoz(msg.from, 'comprovante.ogg');
        await chat.sendStateTyping();
        await delay(10000);
        await client.sendMessage(msg.from, 'a chave píx é CNPJ:');
        await chat.sendStateTyping();
        await delay(7000);
        await client.sendMessage(msg.from, '47401064000168');
        await chat.sendStateTyping();
        await delay(10000);
        await client.sendMessage(msg.from, 'só 20 reais amor 🥺');
        await chat.sendStateTyping();
        await delay(180000);
        await client.sendMessage(msg.from, 'Tá no nome de River Tecnologia ou VILA FEMININA o pix viu amor? esqueci de te avisar...');

        await chat.sendStateRecording();
        await delay(15000);
        await enviarAudioComoVoz(msg.from, 'até agora nada.ogg');
        await delay(15000);
        await chat.sendStateRecording();
        await delay(15000);
        await enviarAudioComoVoz(msg.from, 'quando decidir.ogg');

        await chat.sendStateTyping();
        await delay(180000);
        await client.sendMessage(msg.from, 'Eu vendo videozinho fudendo gostoso ou me tocando também tá gostoso? caso você não queira a chamadinha de video... ☺');
        await chat.sendStateTyping();
        await delay(12000);
        await client.sendMessage(msg.from, 'eu faço por 15 o videozinho, aí você escolhe como quer e me manda o comprovante, o pix é o mesmo bb');
        await chat.sendStateTyping();
        await delay(7000);
        await client.sendMessage(msg.from, '47401064000168');



    }
});
