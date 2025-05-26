import dotenv from 'dotenv';
dotenv.config();
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

import express from 'express';
import axios from 'axios';

import { handleCrisis } from './flows/crisisFlow.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Middleware para logar requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// System prompt inicial, reforçando a linguagem cristã e empática
const systemPrompt = `Você é o Amparo, um assistente virtual cristão. Seu papel:
- Acolher com empatia quem esteja em crise ou ideação suicida.
- Validar sentimentos, citar versículos e orar brevemente.
- No caso de risco iminente (usuário pensa em se ferir), oferecer CVV 188 e SAMU 192 imediatamente.
- Em cenários não-urgentes, seguir o fluxo de coping e esperança cristã.`;

// Frases prontas e IA offline simples
const respostasPadrao = [
  "Estou aqui para te ouvir. Quer conversar um pouco mais?",
  "Lembre-se: você não está sozinho. Deus está contigo em todos os momentos.",
  "Se quiser, posso compartilhar um versículo ou uma oração.",
  "Fale mais sobre o que está sentindo, estou aqui para ajudar.",
  "Às vezes, conversar já é um grande passo. Obrigado por confiar em mim.",
  "Você gostaria de conversar sobre o que está te preocupando?",
  "Se quiser, posso sugerir uma oração ou um versículo de esperança.",
  "Estou aqui para apoiar você, não importa o que esteja sentindo.",
  "Deus nunca nos abandona, mesmo nos momentos mais difíceis.",
  "Se quiser desabafar, pode contar comigo.",
  "A sua vida é muito importante. Fique à vontade para falar o que quiser.",
  "Posso te ajudar a encontrar um pouco de paz neste momento?",
  "Se preferir, posso apenas te ouvir.",
  "Você gostaria de receber uma mensagem de esperança?",
  "Lembre-se: pedir ajuda é um ato de coragem.",
  "Estou aqui para caminhar com você, um passo de cada vez.",
  "Se quiser, posso orar por você agora mesmo.",
  "Você já pensou em conversar com alguém de confiança sobre o que sente?",
  "Deus se importa com você e com o seu coração.",
  "Se quiser, posso compartilhar uma palavra de conforto."
];

const versiculos = [
  "“Deus está perto dos que têm o coração quebrantado.” (Salmo 34:18)",
  "“Lançando sobre Ele toda a vossa ansiedade, porque Ele tem cuidado de vós.” (1 Pedro 5:7)",
  "“O Senhor é o meu pastor, nada me faltará.” (Salmo 23:1)"
];

// Gatilhos e respostas cristãs profundas
const gatilhosCristaos = [
  {
    palavras: ["sem valor", "não tenho valor", "não presto", "sou inútil", "sou um lixo", "não sirvo para nada"],
    resposta: "Eu sei como dói olhar no espelho e não conseguir enxergar beleza ou propósito. Mas Deus te conhece profundamente e te ama incondicionalmente. Nada pode nos separar do Seu amor (Romanos 8:38-39)."
  },
  {
    palavras: ["ansiedade esmagadora", "ansiedade insuportável", "não aguento minha ansiedade", "ansiedade não passa"],
    resposta: "Quando a mente não para de rodar, respire fundo e entregue cada preocupação a Deus. Ele promete te dar uma paz que vai além da nossa compreensão (Filipenses 4:6-7)."
  },
  {
    palavras: ["medo do futuro", "preocupado com o futuro", "não sei o que vai ser de mim", "incerto sobre o futuro"],
    resposta: "Planejar dá medo, eu entendo. Lembre-se: o Senhor está contigo onde você for e te dá força e coragem (Josué 1:9)."
  },
  {
    palavras: ["não amado", "ninguém me ama", "não sou amado", "não sou querida", "não sou querido"],
    resposta: "Mesmo nos dias em que ninguém demonstra carinho, Deus está ao seu lado, te sustentando com o Seu amor fiel (Isaías 41:10)."
  },
  {
    palavras: ["abandono por Deus", "Deus me abandonou", "Deus não me ouve", "Deus está distante"],
    resposta: "Quando parece que Ele está distante, Deus está bem pertinho dos corações partidos, pronto para consolar (Salmo 34:18)."
  },
  {
    palavras: ["cansaço extremo", "muito cansado", "exausto", "não aguento mais o peso"],
    resposta: "Se o peso do dia a dia te derruba, vá até Jesus e descanse os ombros n’Ele. Ele carrega o fardo por você (Mateus 11:28-30)."
  },
  {
    palavras: ["insegurança com a própria imagem", "não gosto do meu corpo", "me acho feio", "me acho feia"],
    resposta: "Você é maravilhosamente criado(a). Cada detalhe foi pensado por Aquele que te formou no ventre (Salmo 139:14)."
  },
  {
    palavras: ["culpa pelos erros do passado", "não me perdoo", "não consigo me perdoar", "me arrependo do que fiz"],
    resposta: "Deus perdoa de todo coração quem se arrepende. Confesse com sinceridade e receba a limpeza que só Ele oferece (1 João 1:9)."
  },
  {
    palavras: ["desespero na recuperação", "não consigo melhorar", "não vejo saída para minha recuperação"],
    resposta: "Mesmo nos piores dias, a misericórdia de Deus se renova a cada manhã. Ele traz esperança viva (Lamentações 3:22-23)."
  },
  {
    palavras: ["rejeição familiar", "minha família não me entende", "não sou aceito em casa", "não sou aceita em casa"],
    resposta: "Quando faltar entendimento em casa, deixe a paz de Cristo governar seu coração e confie na direção Dele (Colossenses 3:15)."
  },
  {
    palavras: ["solidão na dor", "sofro sozinho", "sofro sozinha", "ninguém entende minha dor"],
    resposta: "Ainda que ande por vales sombrios, o Bom Pastor caminha contigo, acalmando todo receio (Salmo 23:1-4)."
  },
  {
    palavras: ["peso para os outros", "sou um peso", "atrapalho a vida dos outros", "só dou trabalho"],
    resposta: "Deus quer todos os seus cuidados; lance sobre Ele toda a sua ansiedade, porque Ele cuida de você (1 Pedro 5:7)."
  },
  {
    palavras: ["impotência", "não consigo fazer nada", "sou impotente", "não tenho forças"],
    resposta: "Na fraqueza, o poder de Cristo se aperfeiçoa. Aceite Sua graça que te sustenta (2 Coríntios 12:9)."
  },
  {
    palavras: ["vergonha profunda", "tenho muita vergonha", "me envergonho de mim"],
    resposta: "Chegue confiante ao trono da graça. Lá você recebe misericórdia e encontra ajuda no momento certo (Hebreus 4:16)."
  },
  {
    palavras: ["insignificante", "sou insignificante", "ninguém liga para mim", "ninguém se importa comigo"],
    resposta: "Deus é teu refúgio e força, socorro bem presente na angústia. Você nunca passa despercebido(a) por Ele (Salmo 18:2)."
  },
  {
    palavras: ["vida fora de controle", "minha vida está fora de controle", "não consigo controlar nada"],
    resposta: "Confie no Senhor de todo o coração. Ele endireitará os seus caminhos, mesmo quando tudo parecer caos (Provérbios 3:5-6)."
  },
  {
    palavras: ["medo da dor", "tenho medo da dor", "tenho medo de sofrer"],
    resposta: "O Senhor está perto dos que têm o coração ferido e salva os de espírito abatido (Salmo 9:9-10)."
  },
  {
    palavras: ["traição de alguém querido", "fui traído", "fui traída", "me traíram"],
    resposta: "Entregue seus fardos aos ombros de Deus; Ele sustenta o justo e não permite que seja abalado (Salmo 55:22)."
  },
  {
    palavras: ["não acolhido", "ninguém me acolhe", "não sou acolhido", "não sou acolhida"],
    resposta: "Deixo-vos a paz; a Minha paz vos dou. Que ela acalme todo turbilhão em seu coração (João 14:27)."
  },
  {
    palavras: ["preso pelo pecado", "não consigo largar o pecado", "sou pecador", "sou pecadora"],
    resposta: "Quando você se sente perdido, lembre-se: Deus te chamou pelo nome e você é Seu (Isaías 43:1)."
  },
  {
    palavras: ["falta de proteção", "não me sinto protegido", "não me sinto protegida"],
    resposta: "Deus é o nosso refúgio e fortaleza, ajuda sempre presente na adversidade (Salmo 46:1)."
  },
  {
    palavras: ["paralisia pelo medo", "não consigo agir de medo", "paralisado pelo medo", "paralisada pelo medo"],
    resposta: "O Senhor vai adiante de você, não tema e nem se assuste, pois Ele está contigo (Deuteronômio 31:8)."
  },
  {
    palavras: ["incapaz de resistir", "não consigo resistir", "não aguento mais lutar"],
    resposta: "Você não enfrenta tentações além do que pode suportar. Deus é fiel e não permitirá que seja tentado além das suas forças (1 Coríntios 10:13)."
  },
  {
    palavras: ["circunstâncias avassaladoras", "tudo está demais para mim", "não aguento as circunstâncias"],
    resposta: "Os que esperam no Senhor renovarão suas forças e sairão voando alto como águias (Isaías 40:31)."
  },
  {
    palavras: ["desejo de desistir", "quero desistir", "não quero mais continuar"],
    resposta: "Não nos cansemos de fazer o bem; no tempo certo colheremos se não desanimarmos (Gálatas 6:9)."
  },
  {
    palavras: ["medo do escuro", "tenho medo do escuro", "tenho medo do desconhecido"],
    resposta: "Levanto os olhos para os montes; de onde me virá o socorro? O meu socorro vem do Senhor (Salmo 121:1-2)."
  },
  {
    palavras: ["fragilidade física ou mental", "me sinto fraco", "me sinto fraca", "minha mente está cansada"],
    resposta: "Minha carne e meu coração podem fraquejar, mas Deus é a rocha eterna que me sustenta (Salmo 73:26)."
  },
  {
    palavras: ["incerteza sobre planos", "não sei o que fazer da vida", "não tenho planos", "meus planos deram errado"],
    resposta: "Eu sei os planos que tenho para você, planos de paz e não de mal, para te dar esperança (Jeremias 29:11)."
  },
  {
    palavras: ["conflitos nos relacionamentos", "briguei com alguém", "conflito com família", "conflito com amigos"],
    resposta: "Alegrem-se na esperança, sejam pacientes na tribulação e perseverem na oração (Romanos 12:12)."
  },
  {
    palavras: ["ausência de alegria", "não sinto alegria", "não tenho alegria", "não sou feliz"],
    resposta: "O choro pode durar uma noite, mas a alegria vem pela manhã. Segure-se nessa promessa (Salmo 30:5)."
  },
  {
    palavras: ["raiva de Deus", "estou com raiva de Deus", "Deus não me entende"],
    resposta: "Busque Deus de todo o coração; encontre-o e Ele se deixará achar por você (Salmo 62:8)."
  },
  {
    palavras: ["incapaz de lidar com tudo", "não dou conta de tudo", "não consigo lidar com tudo"],
    resposta: "Posso todas as coisas naquele que me fortalece. Não há limitação para quem confia em Cristo (Filipenses 4:13)."
  },
  {
    palavras: ["crise de identidade", "não sei quem sou", "crise de identidade"],
    resposta: "Deus, segundo as riquezas da Sua glória, vos dará força interior por Seu Espírito (Efésios 3:16)."
  },
  {
    palavras: ["impaciência na espera", "não aguento esperar", "cansado de esperar", "cansada de esperar"],
    resposta: "Alegrem-se sempre, orem sem cessar, deem graças em todas as circunstâncias (1 Tessalonicenses 5:16-18)."
  },
  {
    palavras: ["remorso constante", "me arrependo sempre", "não esqueço meus erros"],
    resposta: "O Senhor guia os passos do homem bom e Se compraz em seu caminho; mesmo que tropece, não ficará prostrado (Salmo 37:23-24)."
  },
  {
    palavras: ["preocupação contínua", "não paro de me preocupar", "preocupação constante"],
    resposta: "Deus guarda em perfeita paz aquele cujo coração confia n’Ele, porque em Ti confiou (Isaías 26:3)."
  },
  {
    palavras: ["doença ou dor crônica", "vivo doente", "tenho dor crônica", "minha doença não passa"],
    resposta: "O Senhor é a minha luz e a minha salvação; de quem terei temor? Ele é meu refúgio (Salmo 27:1)."
  },
  {
    palavras: ["afastamento de Deus", "me afastei de Deus", "Deus está longe de mim"],
    resposta: "Àquele que pode guardá-los de tropeçar e apresentá-los sem mácula diante da Sua glória, rogo que Deus os aperfeiçoe (Judas 1:24-25)."
  },
  {
    palavras: ["incerteza sobre perdão", "não sei se sou perdoado", "não sei se sou perdoada"],
    resposta: "Ele nos deu tudo o que vivamente diz respeito à vida e à piedade; Se houver falhas, Ele proveu perdão (2 Pedro 1:3)."
  },
  {
    palavras: ["vida sem propósito", "não tenho propósito", "minha vida não tem sentido"],
    resposta: "Estas coisas vos tenho dito para que tenhais paz; no mundo tereis aflições, mas confiai: Eu venci o mundo (João 16:33)."
  },
  {
    palavras: ["ansiedade que impede a oração", "não consigo orar", "ansiedade não deixa eu orar"],
    resposta: "Nunca o deixarei, jamais o abandonarei. Fale com Deus; Ele está sempre pronto a ouvir (Hebreus 13:5)."
  },
  {
    palavras: ["medo de falhar", "tenho medo de falhar", "tenho medo de errar"],
    resposta: "O Senhor está no meio de ti, poderoso para salvar; regozija-te com êxtase, com alegria renovada (Sofonias 3:17)."
  },
  {
    palavras: ["prisão pelo pecado recorrente", "não consigo parar de pecar", "pecado recorrente"],
    resposta: "Eu sou o bom pastor; conheço as minhas ovelhas e dou a minha vida por elas. Ninguém pode arrancá-las da minha mão (João 10:14-15)."
  },
  {
    palavras: ["oração sem resposta aparente", "oro e não sou ouvido", "oro e Deus não responde"],
    resposta: "Deus, fonte de esperança, encha-vos de toda alegria e paz enquanto confiais n’Ele (Romanos 15:13)."
  },
  {
    palavras: ["falta de motivação", "não tenho motivação", "não tenho vontade de nada"],
    resposta: "Deus não nos deu espírito de covardia, mas de poder, amor e equilíbrio (2 Timóteo 1:7)."
  },
  {
    palavras: ["sobrecarregado pelas responsabilidades", "muita responsabilidade", "não aguento as responsabilidades"],
    resposta: "Eis que estou convosco todos os dias até o fim dos tempos. Você não carrega isso sozinho (Mateus 28:20)."
  },
  {
    palavras: ["ofuscado pelos outros", "ninguém me nota", "sou ofuscado pelos outros"],
    resposta: "Deus promete nunca deixar você ou abandoná-lo; Ele te vê e Se importa com cada detalhe (Hebreus 13:5)."
  },
  {
    palavras: ["preso em circunstâncias", "não consigo sair dessa situação", "preso nas circunstâncias"],
    resposta: "O nome do Senhor é torre forte; o justo corre para ela e fica seguro (Provérbios 18:10)."
  },
  {
    palavras: ["esperança esmaecendo", "estou perdendo a esperança", "minha esperança está acabando"],
    resposta: "Tenho posto o Senhor continuamente diante de mim; por isso não vacilo (Salmo 16:8)."
  },
  {
    palavras: ["falta de forças para continuar", "não tenho forças para continuar", "não aguento mais continuar"],
    resposta: "Bendiga o Senhor e não esqueça nenhum de Seus benefícios; Ele cura, perdoa e restaura suas forças (Salmo 103:1-5)."
  }
];

function iaOffline(userMsg, userName) {
  const lower = userMsg.toLowerCase();
  // Frases de abertura empática
  const aberturas = [
    "Eu entendo como isso pode ser doloroso.",
    "Imagino o quanto isso pesa no seu coração.",
    "Sei que não é fácil passar por isso.",
    "Sinto muito que esteja enfrentando esse momento.",
    "Reconheço sua coragem em compartilhar isso."
  ];
  // Frases de encerramento acolhedor
  const encerramentos = [
    "Estou aqui para você. Se quiser, continue compartilhando.",
    "Se sentir necessidade, busque apoio de um profissional. Você merece cuidado.",
    "Conte comigo para conversar sempre que precisar.",
    "Se quiser falar mais, estou à disposição.",
    "Lembre-se: pedir ajuda é um ato de coragem."
  ];
  // Versículo aleatório
  const versiculo = versiculos[Math.floor(Math.random() * versiculos.length)];
  // Oração breve personalizada
  const oracao = userName
    ? `Senhor, acolhe o coração de ${userName}, traz paz, esperança e força. Que Tua presença seja real neste momento. Amém.`
    : "Senhor, acolhe este coração, traz paz, esperança e força. Que Tua presença seja real neste momento. Amém.";
  // Se detectar gatilho cristão
  for (const gatilho of gatilhosCristaos) {
    for (const palavra of gatilho.palavras) {
      if (lower.includes(palavra)) {
        return `${aberturas[Math.floor(Math.random() * aberturas.length)]}\n\n"${versiculo}"\n\n${gatilho.resposta}\n\n${oracao}\n\n${encerramentos[Math.floor(Math.random() * encerramentos.length)]}`;
      }
    }
  }
  // Se detectar crise suicida, reforça o CVV e Instituto Crer + Ser
  if (lower.includes('suicídio') || lower.includes('suicidio') || lower.includes('me matar') || lower.includes('acabar com minha vida')) {
    return `${aberturas[Math.floor(Math.random() * aberturas.length)]}\n\n"${versiculo}"\n\nSinto muito que esteja pensando nisso. Se você estiver pensando em se machucar, ligue para o Centro de Valorização da Vida – 188, Instituto Crer + Ser: 21 98740-1651, ou procure ajuda médica agora mesmo. Deus está com você.\n\n${oracao}\n\n${encerramentos[Math.floor(Math.random() * encerramentos.length)]}`;
  }
  // Detecta se a pessoa pede oração
  if (lower.includes('oração') || lower.includes('orar')) {
    return `${aberturas[Math.floor(Math.random() * aberturas.length)]}\n\n"${versiculo}"\n\nVamos orar juntos${userName ? ', ' + userName : ''}:\nSenhor Deus, neste momento eu Te peço que acolhas este coração aflito. Que Tua presença traga paz, esperança e força para enfrentar cada desafio. Renova o ânimo, consola as dores, ilumina os pensamentos e derrama Teu amor sobre cada área da vida. Que o Teu Espírito Santo envolva, cure e fortaleça. Que a certeza do Teu cuidado seja maior do que qualquer medo ou tristeza. Em nome de Jesus, amém.\n\n${encerramentos[Math.floor(Math.random() * encerramentos.length)]}`;
  }
  // Detecta se pede versículo
  if (lower.includes('versículo') || lower.includes('versiculo')) {
    return `${aberturas[Math.floor(Math.random() * aberturas.length)]}\n\n"${versiculo}"\n\n${oracao}\n\n${encerramentos[Math.floor(Math.random() * encerramentos.length)]}`;
  }
  // Resposta padrão
  return `${aberturas[Math.floor(Math.random() * aberturas.length)]}\n\n"${versiculo}"\n\n${respostasPadrao[Math.floor(Math.random() * respostasPadrao.length)]}\n\n${oracao}\n\n${encerramentos[Math.floor(Math.random() * encerramentos.length)]}`;
}

let userName = null;

// Mensagem de início personalizada
const mensagemInicio = () =>
  userName
    ? `Olá, ${userName}! Eu sou a R.T.E, sua assistente virtual cristã. Como posso te ajudar hoje?`
    : 'Olá! Eu sou a R.T.E, sua assistente virtual cristã. Como posso te ajudar hoje?';

app.post('/chat', async (req, res) => {
  try {
    if (!req.body || typeof req.body.message !== 'string') {
      console.error('Requisição inválida:', req.body);
      return res.status(400).json({ error: 'Mensagem inválida.' });
    }
    const userMsg = req.body.message;
    console.log('Mensagem recebida:', userMsg);

    // Detecta nome
    const match = userMsg.match(/meu nome é ([A-Za-zÀ-ÿ]+)/i) || userMsg.match(/eu sou o ([A-Za-zÀ-ÿ]+)/i) || userMsg.match(/eu sou a ([A-Za-zÀ-ÿ]+)/i);
    if (match) {
      userName = match[1];
      console.log('Nome detectado:', userName);
      // Mensagem de início personalizada após detectar nome
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.json({ reply: mensagemInicio() });
    }

    if (userMsg.trim().toLowerCase() === 'oi' || userMsg.trim().toLowerCase() === 'olá') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.json({ reply: mensagemInicio() });
    }

    if (handleCrisis(userMsg, res)) return;

    // IA offline
    const botReply = iaOffline(userMsg, userName);
    // Pausa de 2 segundos antes de responder
    await new Promise(resolve => setTimeout(resolve, 2000));
    res.json({ reply: botReply });
  } catch (err) {
    console.error('Erro inesperado na rota /chat:', err);
    res.status(500).json({ error: 'Erro inesperado no servidor.' });
  }
});

app.get('/', (req, res) => {
  res.send('Chat server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Chat rodando em http://localhost:${PORT}`);
});
