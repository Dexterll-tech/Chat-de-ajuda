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
  "Se quiser, posso compartilhar uma palavra de conforto.",
  "Não tenha medo de expressar o que sente, estou aqui para acolher.",
  "Sua dor é real e merece atenção.",
  "Você é importante e sua história tem valor.",
  "Mesmo nos dias difíceis, há esperança.",
  "Se quiser, podemos conversar sobre o que te aflige.",
  "Estou ao seu lado, mesmo que virtualmente.",
  "Deus entende cada lágrima e cada silêncio.",
  "Se sentir vontade, escreva tudo o que está no seu coração.",
  "Você não precisa carregar esse peso sozinho.",
  "Estou aqui para te apoiar sem julgamentos.",
  "Se quiser, posso sugerir um exercício de respiração e oração.",
  "Sua vida é preciosa para Deus e para mim.",
  "Não se cobre tanto, cada um tem seu tempo de cura.",
  "Se quiser, posso te enviar uma mensagem de ânimo.",
  "Você já conseguiu superar outros desafios, não está só agora.",
  "Deus conhece o seu coração e cuida de você.",
  "Se quiser, posso te ajudar a encontrar um novo sentido.",
  "Estou aqui para te lembrar que existe esperança.",
  "Você pode confiar seus sentimentos a Deus.",
  "Se quiser, posso te ouvir sem pressa.",
  "Não tenha vergonha de pedir ajuda, isso é sinal de força.",
  "Deus está ao seu lado, mesmo quando tudo parece escuro.",
  "Se quiser, posso compartilhar uma música de esperança.",
  "Você merece cuidado e acolhimento.",
  "Estou aqui para te lembrar que você é amado(a).",
  "Se quiser, podemos orar juntos agora.",
  "Deus pode transformar sua dor em força.",
  "Se quiser, posso te ajudar a enxergar novas possibilidades.",
  "Você não precisa enfrentar tudo sozinho, conte comigo.",
  "Estou aqui para te apoiar em cada passo da sua jornada.",
  "Você é amado(a) por Deus, mesmo quando não sente isso.",
  "Se quiser, posso compartilhar uma história bíblica de superação.",
  "Deus entende até mesmo aquilo que não conseguimos expressar.",
  "Você já pensou em escrever uma carta para Deus? Pode ser um alívio.",
  "A sua dor importa. Não desista de buscar ajuda.",
  "Deus está trabalhando em seu favor, mesmo em silêncio.",
  "Se quiser, posso sugerir um salmo para meditar.",
  "Você já tentou respirar fundo e entregar seus pensamentos a Deus?",
  "A esperança pode renascer mesmo nos dias mais escuros.",
  "Deus te conhece pelo nome e se importa com cada detalhe da sua vida.",
  "Se quiser, posso te ajudar a encontrar um grupo de apoio.",
  "Você não precisa ser forte o tempo todo. Pode descansar em Deus.",
  "Deus é especialista em recomeços.",
  "Se quiser, posso sugerir um exercício de gratidão.",
  "Você já percebeu alguma pequena vitória hoje?",
  "Deus está ao seu lado, mesmo quando tudo parece perdido.",
  "Se quiser, posso compartilhar um louvor para te fortalecer.",
  "Você é importante para mim e para Deus.",
  "Não tenha medo de mostrar sua vulnerabilidade.",
  "Deus pode transformar lágrimas em sementes de alegria.",
  "Se quiser, posso te ajudar a organizar seus pensamentos.",
  "Você já tentou conversar com alguém da sua confiança hoje?",
  "Deus é abrigo seguro em tempos de tempestade.",
  "Se quiser, posso compartilhar um testemunho de fé.",
  "Você é mais forte do que imagina.",
  "Deus te sustenta mesmo quando você sente que vai cair.",
  "Se quiser, posso te ajudar a encontrar um novo propósito.",
  "Você pode confiar seus medos a Deus.",
  "Deus te acolhe com amor e misericórdia.",
  "Se quiser, posso sugerir um versículo para decorar.",
  "Você já agradeceu por algo hoje? Pequenas coisas contam.",
  "Deus está ouvindo sua oração, mesmo em silêncio.",
  "Se quiser, posso te ajudar a fazer uma lista de motivos para ter esperança.",
  "Você é uma pessoa única e insubstituível.",
  "Deus te fortalece nas suas fraquezas.",
  "Se quiser, posso compartilhar uma promessa bíblica.",
  "Você pode confiar no cuidado de Deus.",
  "Deus te ama com amor eterno.",
  "Se quiser, posso te ajudar a encontrar paz interior.",
  "Você já tentou escrever sobre seus sentimentos?",
  "Deus está perto dos que choram.",
  "Se quiser, posso sugerir um exercício de respiração consciente.",
  "Você é digno(a) de amor e respeito.",
  "Deus nunca desiste de você.",
  "Se quiser, posso compartilhar uma oração de consolo.",
  "Você pode confiar que dias melhores virão.",
  "Deus é especialista em restaurar corações.",
  "Se quiser, posso te ajudar a enxergar o lado bom das coisas.",
  "Você é uma bênção na vida de alguém.",
  "Deus te vê com olhos de compaixão.",
  "Se quiser, posso compartilhar um texto inspirador.",
  "Você pode ser luz mesmo em meio à escuridão.",
  "Deus te chama para viver uma nova história.",
  "Se quiser, posso te ajudar a encontrar um novo caminho.",
  "Você é precioso(a) para Deus.",
  "Deus te entende, mesmo quando ninguém mais entende.",
  "Se quiser, posso compartilhar um conselho bíblico.",
  "Você pode confiar que Deus está cuidando de tudo.",
  "Deus te abraça com Seu amor.",
  "Se quiser, posso te ajudar a orar por um pedido específico.",
  "Você é forte por buscar ajuda.",
  "Deus te sustenta com Sua mão poderosa.",
  "Se quiser, posso compartilhar um salmo de conforto.",
  "Você pode descansar em Deus.",
  "Deus te renova a cada manhã.",
  "Se quiser, posso te ajudar a encontrar esperança.",
  "Você é amado(a) além do que pode imaginar.",
  "Deus te protege em todos os momentos.",
  "Se quiser, posso compartilhar uma palavra de ânimo.",
  "Você pode confiar que Deus tem um plano para você.",
  "Deus te consola em toda angústia.",
  "Se quiser, posso te ajudar a enxergar o valor da sua vida.",
  "Você é importante para Deus e para mim.",
  "Deus te dá forças para continuar.",
  "Se quiser, posso compartilhar uma oração de gratidão.",
  "Você pode confiar que Deus está ouvindo seu clamor.",
  "Deus te acolhe com braços abertos.",
  "Se quiser, posso te ajudar a encontrar sentido na dor.",
  "Você é capaz de superar esse momento.",
  "Deus te guia mesmo quando não vê o caminho.",
  "Se quiser, posso compartilhar uma mensagem de esperança.",
  "Você pode confiar que Deus está ao seu lado.",
  "Deus te dá paz em meio à tempestade.",
  "Se quiser, posso te ajudar a encontrar alegria nas pequenas coisas.",
  "Você é amado(a) por Deus, não importa o que aconteça.",
  "Deus te fortalece para enfrentar qualquer desafio.",
  "Se quiser, posso compartilhar um versículo de coragem.",
  "Você pode confiar que Deus está trabalhando em seu favor.",
  "Deus te sustenta com Sua graça.",
  "Se quiser, posso te ajudar a encontrar um novo começo.",
  "Você é importante para o Reino de Deus.",
  "Deus te dá esperança para o futuro.",
  "Se quiser, posso compartilhar uma oração de esperança.",
  "Você pode confiar que Deus está no controle.",
  "Deus te ama com amor incondicional.",
  "Se quiser, posso te ajudar a enxergar a beleza da vida.",
  "Você é uma pessoa especial para Deus.",
  "Deus te dá coragem para seguir em frente.",
  "Se quiser, posso compartilhar um testemunho de superação.",
  "Você pode confiar que Deus está preparando algo bom.",
  "Deus te consola em todo tempo.",
  "Se quiser, posso te ajudar a encontrar paz no coração.",
  "Você é amado(a) e nunca está só.",
  "Deus te dá alegria verdadeira.",
  "Se quiser, posso compartilhar uma palavra de fé.",
  "Você pode confiar que Deus está ouvindo sua oração.",
  "Deus te sustenta com Seu amor eterno."
];

// Corrigir expressão regular e estruturar gatilhos com versículo específico
const versiculos = [
  "“Deus está perto dos que têm o coração quebrantado.” (Salmo 34:18)",
  "“Lançando sobre Ele toda a vossa ansiedade, porque Ele tem cuidado de vós.” (1 Pedro 5:7)",
  "“O Senhor é o meu pastor, nada me faltará.” (Salmo 23:1)",
  "“Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.” (Salmo 23:4)",
  "“Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.” (Mateus 11:28)",
  "“O Senhor é bom, um refúgio em tempos de angústia.” (Naum 1:7)",
  "“O choro pode durar uma noite, mas a alegria vem pela manhã.” (Salmo 30:5)",
  "“Não temas, porque eu sou contigo.” (Isaías 41:10)",
  "“Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.” (Romanos 12:12)",
  "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)",
  "“Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.” (Salmo 46:1)",
  "“Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.” (Provérbios 3:5)",
  "“O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.” (Salmo 34:18)",
  "“Tudo posso naquele que me fortalece.” (Filipenses 4:13)",
  "“O Senhor pelejará por vós, e vós vos calareis.” (Êxodo 14:14)",
  "“Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.” (Jeremias 29:11)",
  "“O Senhor é bom para todos; a sua compaixão alcança todas as suas criaturas.” (Salmo 145:9)",
  "“O Senhor é a força do seu povo, a fortaleza que salva o seu ungido.” (Salmo 28:8)",
  "“O Senhor está perto de todos os que o invocam, de todos os que o invocam com sinceridade.” (Salmo 145:18)",
  // ...adicione aqui mais versículos até chegar a 100...
];

// Exemplo de estrutura de gatilho com versículo específico
const gatilhosCristaos = [
  {
    palavras: ["sem valor", "não tenho valor", "não presto", "sou inútil", "sou um lixo", "não sirvo para nada"],
    resposta: "Eu sei como dói olhar no espelho e não conseguir enxergar beleza ou propósito. Mas Deus te conhece profundamente e te ama incondicionalmente. Nada pode nos separar do Seu amor.",
    versiculo: "“Nada poderá nos separar do amor de Deus.” (Romanos 8:38-39)"
  },
  {
    palavras: ["ansiedade esmagadora", "ansiedade insuportável", "não aguento minha ansiedade", "ansiedade não passa"],
    resposta: "Quando a mente não para de rodar, respire fundo e entregue cada preocupação a Deus. Ele promete te dar uma paz que vai além da nossa compreensão.",
    versiculo: "“Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, apresentem seus pedidos a Deus.” (Filipenses 4:6-7)"
  },
  {
    palavras: ["medo do futuro", "preocupado com o futuro", "não sei o que vai ser de mim", "incerto sobre o futuro"],
    resposta: "Planejar dá medo, eu entendo. Lembre-se: o Senhor está contigo onde você for e te dá força e coragem.",
    versiculo: "“Não fui eu que lhe ordenei? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.” (Josué 1:9)"
  },
  {
    palavras: ["não amado", "ninguém me ama", "não sou amado", "não sou querida", "não sou querido"],
    resposta: "Mesmo nos dias em que ninguém demonstra carinho, Deus está ao seu lado, te sustentando com o Seu amor fiel (Isaías 41:10).",
    versiculo: "“O Senhor é bom, um refúgio em tempos de angústia.” (Naum 1:7)"
  },
  {
    palavras: ["abandono por Deus", "Deus me abandonou", "Deus não me ouve", "Deus está distante"],
    resposta: "Quando parece que Ele está distante, Deus está bem pertinho dos corações partidos, pronto para consolar (Salmo 34:18).",
    versiculo: "“Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.” (Salmo 23:4)"
  },
  {
    palavras: ["cansaço extremo", "muito cansado", "exausto", "não aguento mais o peso"],
    resposta: "Se o peso do dia a dia te derruba, vá até Jesus e descanse os ombros n’Ele. Ele carrega o fardo por você (Mateus 11:28-30).",
    versiculo: "“Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.” (Mateus 11:28)"
  },
  {
    palavras: ["insegurança com a própria imagem", "não gosto do meu corpo", "me acho feio", "me acho feia"],
    resposta: "Você é maravilhosamente criado(a). Cada detalhe foi pensado por Aquele que te formou no ventre (Salmo 139:14).",
    versiculo: "“Eu te louvo porque me fizeste de modo especial e admirável. Suas obras são maravilhosas!” (Salmo 139:14)"
  },
  {
    palavras: ["culpa pelos erros do passado", "não me perdoo", "não consigo me perdoar", "me arrependo do que fiz"],
    resposta: "Deus perdoa de todo coração quem se arrepende. Confesse com sinceridade e receba a limpeza que só Ele oferece (1 João 1:9).",
    versiculo: "“Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda a injustiça.” (1 João 1:9)"
  },
  {
    palavras: ["desespero na recuperação", "não consigo melhorar", "não vejo saída para minha recuperação"],
    resposta: "Mesmo nos piores dias, a misericórdia de Deus se renova a cada manhã. Ele traz esperança viva (Lamentações 3:22-23).",
    versiculo: "“As misericórdias do Senhor são a causa de não sermos consumidos; elas se renovam a cada manhã.” (Lamentações 3:22-23)"
  },
  {
    palavras: ["rejeição familiar", "minha família não me entende", "não sou aceito em casa", "não sou aceita em casa"],
    resposta: "Quando faltar entendimento em casa, deixe a paz de Cristo governar seu coração e confie na direção Dele (Colossenses 3:15).",
    versiculo: "“E a paz de Cristo, para a qual vocês foram chamados em um só corpo, domine em seus corações.” (Colossenses 3:15)"
  },
  {
    palavras: ["solidão na dor", "sofro sozinho", "sofro sozinha", "ninguém entende minha dor"],
    resposta: "Ainda que ande por vales sombrios, o Bom Pastor caminha contigo, acalmando todo receio (Salmo 23:1-4).",
    versiculo: "“Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.” (Salmo 23:4)"
  },
  {
    palavras: ["peso para os outros", "sou um peso", "atrapalho a vida dos outros", "só dou trabalho"],
    resposta: "Deus quer todos os seus cuidados; lance sobre Ele toda a sua ansiedade, porque Ele cuida de você (1 Pedro 5:7).",
    versiculo: "“Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.” (1 Pedro 5:7)"
  },
  {
    palavras: ["impotência", "não consigo fazer nada", "sou impotente", "não tenho forças"],
    resposta: "Na fraqueza, o poder de Cristo se aperfeiçoa. Aceite Sua graça que te sustenta (2 Coríntios 12:9).",
    versiculo: "“Mas ele disse: 'Minha graça é suficiente para você, pois o meu poder se aperfeiçoa na fraqueza'.” (2 Coríntios 12:9)"
  },
  {
    palavras: ["vergonha profunda", "tenho muita vergonha", "me envergonho de mim"],
    resposta: "Chegue confiante ao trono da graça. Lá você recebe misericórdia e encontra ajuda no momento certo (Hebreus 4:16).",
    versiculo: "“Cheguemo-nos, pois, com confiança, ao trono da graça, a fim de recebermos misericórdia e acharmos graça para ajudarmos em time de necessidade.” (Hebreus 4:16)"
  },
  {
    palavras: ["insignificante", "sou insignificante", "ninguém liga para mim", "ninguém se importa comigo"],
    resposta: "Deus é teu refúgio e força, socorro bem presente na angústia. Você nunca passa despercebido(a) por Ele (Salmo 18:2).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["vida fora de controle", "minha vida está fora de controle", "não consigo controlar nada"],
    resposta: "Confie no Senhor de todo o coração. Ele endireitará os seus caminhos, mesmo quando tudo parecer caos (Provérbios 3:5-6).",
    versiculo: "“Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.” (Provérbios 3:5)"
  },
  {
    palavras: ["medo da dor", "tenho medo da dor", "tenho medo de sofrer"],
    resposta: "O Senhor está perto dos que têm o coração ferido e salva os de espírito abatido (Salmo 9:9-10).",
    versiculo: "“O Senhor é bom, um refúgio em tempos de angústia.” (Naum 1:7)"
  },
  {
    palavras: ["traição de alguém querido", "fui traído", "fui traída", "me traíram"],
    resposta: "Entregue seus fardos aos ombros de Deus; Ele sustenta o justo e não permite que seja abalado (Salmo 55:22).",
    versiculo: "“Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.” (1 Pedro 5:7)"
  },
  {
    palavras: ["não acolhido", "ninguém me acolhe", "não sou acolhido", "não sou acolhida"],
    resposta: "Deixo-vos a paz; a Minha paz vos dou. Que ela acalme todo turbilhão em seu coração (João 14:27).",
    versiculo: "“A paz esteja com vocês! Como o Pai me enviou, eu os envio também.” (João 20:21)"
  },
  {
    palavras: ["preso pelo pecado", "não consigo largar o pecado", "sou pecador", "sou pecadora"],
    resposta: "Quando você se sente perdido, lembre-se: Deus te chamou pelo nome e você é Seu (Isaías 43:1).",
    versiculo: "“Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores.” (Romanos 5:8)"
  },
  {
    palavras: ["falta de proteção", "não me sinto protegido", "não me sinto protegida"],
    resposta: "Deus é o nosso refúgio e fortaleza, ajuda sempre presente na adversidade (Salmo 46:1).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["paralisia pelo medo", "não consigo agir de medo", "paralisado pelo medo", "paralisada pelo medo"],
    resposta: "O Senhor vai adiante de você, não tema e nem se assuste, pois Ele está contigo (Deuteronômio 31:8).",
    versiculo: "“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.” (Isaías 41:10)"
  },
  {
    palavras: ["incapaz de resistir", "não consigo resistir", "não aguento mais lutar"],
    resposta: "Você não enfrenta tentações além do que pode suportar. Deus é fiel e não permitirá que seja tentado além das suas forças (1 Coríntios 10:13).",
    versiculo: "“Não veio sobre vós tentação que não fosse humana; mas fiel é Deus que não vos deixará tentar além do que podeis.” (1 Coríntios 10:13)"
  },
  {
    palavras: ["circunstâncias avassaladoras", "tudo está demais para mim", "não aguento as circunstâncias"],
    resposta: "Os que esperam no Senhor renovarão suas forças e sairão voando alto como águias (Isaías 40:31).",
    versiculo: "“Mas os que esperam no Senhor renovarão as suas forças. Eles subirão com asas como águias; correrão, e não se cansarão; andarão, e não se fatigarão.” (Isaías 40:31)"
  },
  {
    palavras: ["desejo de desistir", "quero desistir", "não quero mais continuar"],
    resposta: "Não nos cansemos de fazer o bem; no tempo certo colheremos se não desanimarmos (Gálatas 6:9).",
    versiculo: "“E não nos cansemos de fazer o bem, pois no devido tempo colheremos, se não desanimarmos.” (Gálatas 6:9)"
  },
  {
    palavras: ["medo do escuro", "tenho medo do escuro", "tenho medo do desconhecido"],
    resposta: "Levanto os olhos para os montes; de onde me virá o socorro? O meu socorro vem do Senhor (Salmo 121:1-2).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["fragilidade física ou mental", "me sinto fraco", "me sinto fraca", "minha mente está cansada"],
    resposta: "Minha carne e meu coração podem fraquejar, mas Deus é a rocha eterna que me sustenta (Salmo 73:26).",
    versiculo: "“O Senhor é a força do seu povo, a fortaleza que salva o seu ungido.” (Salmo 28:8)"
  },
  {
    palavras: ["incerteza sobre planos", "não sei o que fazer da vida", "não tenho planos", "meus planos deram errado"],
    resposta: "Eu sei os planos que tenho para você, planos de paz e não de mal, para te dar esperança (Jeremias 29:11).",
    versiculo: "“Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.” (Jeremias 29:11)"
  },
  {
    palavras: ["conflitos nos relacionamentos", "briguei com alguém", "conflito com família", "conflito com amigos"],
    resposta: "Alegrem-se na esperança, sejam pacientes na tribulação e perseverem na oração (Romanos 12:12).",
    versiculo: "“Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.” (Romanos 12:12)"
  },
  {
    palavras: ["ausência de alegria", "não sinto alegria", "não tenho alegria", "não sou feliz"],
    resposta: "O choro pode durar uma noite, mas a alegria vem pela manhã. Segure-se nessa promessa (Salmo 30:5).",
    versiculo: "“O choro pode durar uma noite, mas a alegria vem pela manhã.” (Salmo 30:5)"
  },
  {
    palavras: ["raiva de Deus", "estou com raiva de Deus", "Deus não me entende"],
    resposta: "Busque Deus de todo o coração; encontre-o e Ele se deixará achar por você (Salmo 62:8).",
    versiculo: "“Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.” (Provérbios 3:5)"
  },
  {
    palavras: ["incapaz de lidar com tudo", "não dou conta de tudo", "não consigo lidar com tudo"],
    resposta: "Posso todas as coisas naquele que me fortalece. Não há limitação para quem confia em Cristo (Filipenses 4:13).",
    versiculo: "“Tudo posso naquele que me fortalece.” (Filipenses 4:13)"
  },
  {
    palavras: ["crise de identidade", "não sei quem sou", "crise de identidade"],
    resposta: "Deus, segundo as riquezas da Sua glória, vos dará força interior por Seu Espírito (Efésios 3:16).",
    versiculo: "“E não vos conformeis com este mundo, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.” (Romanos 12:2)"
  },
  {
    palavras: ["impaciência na espera", "não aguento esperar", "cansado de esperar", "cansada de esperar"],
    resposta: "Alegrem-se sempre, orem sem cessar, deem graças em todas as circunstâncias (1 Tessalonicenses 5:16-18).",
    versiculo: "“Alegrai-vos sempre, orem sem cessar, deem graças em todas as circunstâncias.” (1 Tessalonicenses 5:16-18)"
  },
  {
    palavras: ["remorso constante", "me arrependo sempre", "não esqueço meus erros"],
    resposta: "O Senhor guia os passos do homem bom e Se compraz em seu caminho; mesmo que tropece, não ficará prostrado (Salmo 37:23-24).",
    versiculo: "“Os passos de um homem bom são confirmados pelo Senhor, e ele se deleita no seu caminho.” (Salmo 37:23)"
  },
  {
    palavras: ["preocupação contínua", "não paro de me preocupar", "preocupação constante"],
    resposta: "Deus guarda em perfeita paz aquele cujo coração confia n’Ele, porque em Ti confiou (Isaías 26:3).",
    versiculo: "“Tu, Senhor, guardarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.” (Isaías 26:3)"
  },
  {
    palavras: ["doença ou dor crônica", "vivo doente", "tenho dor crônica", "minha doença não passa"],
    resposta: "O Senhor é a minha luz e a minha salvação; de quem terei temor? Ele é meu refúgio (Salmo 27:1).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["afastamento de Deus", "me afastei de Deus", "Deus está longe de mim"],
    resposta: "Àquele que pode guardá-los de tropeçar e apresentá-los sem mácula diante da Sua glória, rogo que Deus os aperfeiçoe (Judas 1:24-25).",
    versiculo: "“Aquele que é poderoso para vos guardar de tropeçar e apresentar-vos irrepreensíveis diante da sua glória, com grande alegria, é o único Deus, nosso Salvador.” (Judas 1:24-25)"
  },
  {
    palavras: ["incerteza sobre perdão", "não sei se sou perdoado", "não sei se sou perdoada"],
    resposta: "Ele nos deu tudo o que vivamente diz respeito à vida e à piedade; Se houver falhas, Ele proveu perdão (2 Pedro 1:3).",
    versiculo: "“E, se alguém pecar, temos um Advogado junto ao Pai, Jesus Cristo, o justo.” (1 João 2:1)"
  },
  {
    palavras: ["vida sem propósito", "não tenho propósito", "minha vida não tem sentido"],
    resposta: "Estas coisas vos tenho dito para que tenhais paz; no mundo tereis aflições, mas confiai: Eu venci o mundo (João 16:33).",
    versiculo: "“Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor, pensamentos de paz e não de mal, para vos dar o fim que esperais.” (Jeremias 29:11)"
  },
  {
    palavras: ["ansiedade que impede a oração", "não consigo orar", "ansiedade não deixa eu orar"],
    resposta: "Nunca o deixarei, jamais o abandonarei. Fale com Deus; Ele está sempre pronto a ouvir (Hebreus 13:5).",
    versiculo: "“Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, apresentem seus pedidos a Deus.” (Filipenses 4:6-7)"
  },
  {
    palavras: ["medo de falhar", "tenho medo de falhar", "tenho medo de errar"],
    resposta: "O Senhor está no meio de ti, poderoso para salvar; regozija-te com êxtase, com alegria renovada (Sofonias 3:17).",
    versiculo: "“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.” (Isaías 41:10)"
  },
  {
    palavras: ["prisão pelo pecado recorrente", "não consigo parar de pecar", "pecado recorrente"],
    resposta: "Eu sou o bom pastor; conheço as minhas ovelhas e dou a minha vida por elas. Ninguém pode arrancá-las da minha mão (João 10:14-15).",
    versiculo: "“Eu sou o bom pastor; conheço as minhas ovelhas e dou a minha vida por elas.” (João 10:14)"
  },
  {
    palavras: ["oração sem resposta aparente", "oro e não sou ouvido", "oro e Deus não responde"],
    resposta: "Deus, fonte de esperança, encha-vos de toda alegria e paz enquanto confiais n’Ele (Romanos 15:13).",
    versiculo: "“E tudo o que pedirdes na oração, crendo, o recebereis.” (Mateus 21:22)"
  },
  {
    palavras: ["falta de motivação", "não tenho motivação", "não tenho vontade de nada"],
    resposta: "Deus não nos deu espírito de covardia, mas de poder, amor e equilíbrio (2 Timóteo 1:7).",
    versiculo: "“Porque Deus não nos deu espírito de covardia, mas de poder, amor e moderação.” (2 Timóteo 1:7)"
  },
  {
    palavras: ["sobrecarregado pelas responsabilidades", "muita responsabilidade", "não aguento as responsabilidades"],
    resposta: "Eis que estou convosco todos os dias até o fim dos tempos. Você não carrega isso sozinho (Mateus 28:20).",
    versiculo: "“Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.” (Mateus 11:28)"
  },
  {
    palavras: ["ofuscado pelos outros", "ninguém me nota", "sou ofuscado pelos outros"],
    resposta: "Deus promete nunca deixar você ou abandoná-lo; Ele te vê e Se importa com cada detalhe (Hebreus 13:5).",
    versiculo: "“Não te deixarei, nem te abandonarei.” (Hebreus 13:5)"
  },
  {
    palavras: ["preso em circunstâncias", "não consigo sair dessa situação", "preso nas circunstâncias"],
    resposta: "O nome do Senhor é torre forte; o justo corre para ela e fica seguro (Provérbios 18:10).",
    versiculo: "“O nome do Senhor é uma torre forte; os justos correm para ela e estão seguros.” (Provérbios 18:10)"
  },
  {
    palavras: ["esperança esmaecendo", "estou perdendo a esperança", "minha esperança está acabando"],
    resposta: "Tenho posto o Senhor continuamente diante de mim; por isso não vacilo (Salmo 16:8).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["falta de forças para continuar", "não tenho forças para continuar", "não aguento mais continuar"],
    resposta: "Bendiga o Senhor e não esqueça nenhum de Seus benefícios; Ele cura, perdoa e restaura suas forças (Salmo 103:1-5).",
    versiculo: "“Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.” (Salmo 103:2)"
  },
  {
    palavras: ["não vejo sentido em nada", "tudo perdeu o sentido", "minha vida não faz sentido"],
    resposta: "Mesmo quando tudo parece sem sentido, Deus tem um propósito para sua vida. Ele te ama e quer te dar esperança (Jeremias 29:11).",
    versiculo: "“Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.” (Jeremias 29:11)"
  },
  {
    palavras: ["não quero mais acordar", "preferia não acordar", "queria dormir para sempre"],
    resposta: "Sei que o desânimo pode ser profundo, mas Deus renova a cada manhã a esperança. Ele está contigo mesmo nos dias mais difíceis (Lamentações 3:22-23).",
    versiculo: "“As misericórdias do Senhor são a causa de não sermos consumidos; elas se renovam a cada manhã.” (Lamentações 3:22-23)"
  },
  {
    palavras: ["não vejo saída", "não tem saída para mim", "não vejo solução"],
    resposta: "Quando não vemos saída, Deus abre caminhos onde não imaginamos. Confie n'Ele, pois Ele é especialista em milagres (Isaías 43:19).",
    versiculo: "“Eis que eu faço uma coisa nova; agora sairá à luz. Porventura não a percebeis?” (Isaías 43:19)"
  },
  {
    palavras: ["ninguém se importa comigo", "ninguém liga para mim", "ninguém sentiria minha falta"],
    resposta: "Você é precioso(a) para Deus. Ele se importa profundamente com você e nunca te abandona (Salmo 27:10).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["não tenho forças para continuar", "não aguento mais lutar", "estou cansado de lutar"],
    resposta: "Quando nossas forças acabam, Deus nos carrega no colo. Ele é a sua força e seu refúgio (Salmo 28:7).",
    versiculo: "“O Senhor é a minha força e o meu escudo; nele confia o meu coração, e fui ajudado.” (Salmo 28:7)"
  },
  {
    palavras: ["quero sumir", "queria desaparecer", "queria sumir do mundo"],
    resposta: "Mesmo quando você quer sumir, Deus te vê, te entende e te acolhe. Ele está perto dos que sofrem (Salmo 34:18).",
    versiculo: "“O Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido.” (Salmo 34:18)"
  },
  {
    palavras: ["não sou importante", "sou insignificante", "ninguém precisa de mim"],
    resposta: "Você é importante para Deus e para o mundo. Sua vida tem valor e propósito (Salmo 139:14-16).",
    versiculo: "“Eu te louvo porque me fizeste de modo especial e admirável. Suas obras são maravilhosas!” (Salmo 139:14)"
  },
  {
    palavras: ["não tenho amigos", "estou sozinho", "ninguém quer ficar comigo"],
    resposta: "Mesmo na solidão, Deus é seu amigo fiel. Ele nunca te deixa só (João 15:15).",
    versiculo: "“Eis que estou convosco todos os dias, até a consumação do século.” (Mateus 28:20)"
  },
  {
    palavras: ["não consigo parar de chorar", "choro o tempo todo", "não paro de chorar"],
    resposta: "Deus recolhe cada lágrima sua e se importa com sua dor. Ele enxugará toda lágrima (Apocalipse 21:4).",
    versiculo: "“Ele enxugará dos seus olhos toda a lágrima. E não haverá mais morte, nem pranto, nem clamor, nem dor, porque já passaram as primeiras coisas.” (Apocalipse 21:4)"
  },
  {
    palavras: ["não tenho esperança", "perdi a esperança", "não acredito mais em nada"],
    resposta: "A esperança pode renascer mesmo nos vales mais escuros. Deus é especialista em recomeços (Romanos 15:13).",
    versiculo: "“Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor, pensamentos de paz e não de mal, para vos dar o fim que esperais.” (Jeremias 29:11)"
  },
  {
    palavras: ["não quero mais viver", "não quero mais estar aqui", "não quero mais existir"],
    resposta: "Sua vida é preciosa para Deus. Se estiver pensando em se machucar, procure ajuda imediatamente: CVV 188 ou Instituto Crer+Ser 21 98740-1651. Deus te ama profundamente (Salmo 118:17).",
    versiculo: "“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.” (Isaías 41:10)"
  },
  {
    palavras: ["não consigo confiar em ninguém", "não confio em ninguém", "ninguém é confiável"],
    resposta: "Mesmo quando não confiamos em ninguém, podemos confiar em Deus. Ele é fiel e nunca falha (2 Timóteo 2:13).",
    versiculo: "“Se formos infiéis, ele permanece fiel; não pode negar-se a si mesmo.” (2 Timóteo 2:13)"
  },
  {
    palavras: ["não tenho paz", "minha mente não para", "não consigo descansar"],
    resposta: "Deus oferece uma paz que excede todo entendimento. Entregue suas preocupações a Ele (Filipenses 4:7).",
    versiculo: "“E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus.” (Filipenses 4:7)"
  },
  {
    palavras: ["me sinto vazio", "me sinto vazia", "tenho um vazio dentro de mim"],
    resposta: "Só Deus pode preencher o vazio do nosso coração. Ele te ama e quer te dar vida plena (João 10:10).",
    versiculo: "“Eu vim para que tenham vida, e a tenham em abundância.” (João 10:10)"
  },
  {
    palavras: ["não consigo sentir Deus", "Deus está longe", "Deus não me ouve"],
    resposta: "Mesmo quando não sentimos, Deus está perto. Ele nunca te abandona (Deuteronômio 31:6).",
    versiculo: "“Não te deixarei, nem te abandonarei.” (Hebreus 13:5)"
  },
  {
    palavras: ["não tenho vontade de nada", "não quero fazer nada", "não tenho motivação"],
    resposta: "Deus pode renovar sua motivação e alegria. Ele entende seu cansaço e quer te fortalecer (Isaías 40:29).",
    versiculo: "“Ele dá força ao cansado e aumenta as forças daquele que não tem nenhum vigor.” (Isaías 40:29)"
  },
  {
    palavras: ["me sinto um fracasso", "sou um fracasso", "só fracasso na vida"],
    resposta: "Você não é um fracasso para Deus. Ele te vê com olhos de amor e acredita em você (Jeremias 29:11).",
    versiculo: "“Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor, pensamentos de paz e não de mal, para vos dar o fim que esperais.” (Jeremias 29:11)"
  },
  {
    palavras: ["não consigo me perdoar", "me culpo pelo passado", "não mereço perdão"],
    resposta: "Deus perdoa de todo coração quem se arrepende. Receba o perdão e recomece (1 João 1:9).",
    versiculo: "“Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda a injustiça.” (1 João 1:9)"
  },
  {
    palavras: ["não tenho ninguém", "ninguém se importa", "ninguém liga para mim"],
    resposta: "Você nunca está só. Deus se importa profundamente com você (Salmo 27:10).",
    versiculo: "“O Senhor é a minha luz e a minha salvação; de quem terei medo?” (Salmo 27:1)"
  },
  {
    palavras: ["não quero incomodar ninguém", "sou um peso para os outros", "não quero atrapalhar"],
    resposta: "Você não é um peso. Deus te ama e quer te ajudar a carregar os fardos (Mateus 11:28).",
    versiculo: "“Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.” (Mateus 11:28)"
  },
  {
    palavras: ["não consigo sair dessa", "não vejo saída para mim", "não consigo melhorar"],
    resposta: "Deus é especialista em transformar situações impossíveis. Confie n'Ele (Lucas 18:27).",
    versiculo: "“O que é impossível para os homens é possível para Deus.” (Lucas 18:27)"
  },
  {
    palavras: ["me sinto perdido", "me sinto perdida", "não sei o que fazer"],
    resposta: "Quando estamos perdidos, Deus nos guia e mostra o caminho (Salmo 32:8).",
    versiculo: "“Eu te instruirei e te ensinarei o caminho que deves seguir; eu te darei conselhos e cuidarei de você.” (Salmo 32:8)"
  },
  {
    palavras: ["não tenho mais fé", "perdi a fé", "não acredito mais em Deus"],
    resposta: "Mesmo quando a fé vacila, Deus permanece fiel. Ele pode renovar sua fé (2 Timóteo 2:13).",
    versiculo: "“Se formos infiéis, ele permanece fiel; não pode negar-se a si mesmo.” (2 Timóteo 2:13)"
  },
  {
    palavras: ["não tenho mais sonhos", "desisti dos meus sonhos", "não acredito mais em sonhos"],
    resposta: "Deus pode restaurar seus sonhos e te dar novos motivos para viver (Salmo 37:4-5).",
    versiculo: "“Deleita-te também no Senhor, e te concederá os desejos do teu coração.” (Salmo 37:4)"
  },
  {
    palavras: ["não consigo dormir", "tenho insônia", "não durmo direito"],
    resposta: "Deus dá o sono aos seus amados. Peça a Ele descanso e paz (Salmo 4:8).",
    versiculo: "“Em paz me deito e logo adormeço, pois só tu, Senhor, me fazes descansar em segurança.” (Salmo 4:8)"
  },
  {
    palavras: ["me sinto sufocado", "me sinto sufocada", "não consigo respirar direito"],
    resposta: "Quando tudo aperta, Deus é o ar que precisamos. Respire fundo e confie n'Ele (Salmo 61:2).",
    versiculo: "“Do fim da terra clamei a ti, quando o meu coração desmaiava; leva-me para a rocha que é mais alta do que eu.” (Salmo 61:2)"
  },
  {
    palavras: ["não tenho vontade de comer", "não sinto fome", "não quero comer"],
    resposta: "Deus se importa com cada detalhe do seu corpo e da sua mente. Ele cuida de você (Mateus 6:26).",
    versiculo: "“Olhem para as aves do céu. Não semeiam, não colhem, nem armazenam em celeiros, mas o Pai celestial as alimenta. Não valem vocês muito mais do que elas?” (Mateus 6:26)"
  },
  {
    palavras: ["me sinto rejeitado", "me sinto rejeitada", "ninguém me aceita"],
    resposta: "Mesmo rejeitado(a) pelo mundo, você é aceito(a) por Deus (Efésios 1:6).",
    versiculo: "“Porque Deus tanto amou o mundo que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna.” (João 3:16)"
  },
  {
    palavras: ["não tenho mais vontade de viver", "não quero mais viver", "não vejo mais sentido em viver"],
    resposta: "Sua vida é preciosa para Deus. Se estiver pensando em se machucar, procure ajuda imediatamente: CVV 188 ou Instituto Crer+Ser 21 98740-1651. Deus te ama profundamente (Salmo 118:17).",
    versiculo: "“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.” (Isaías 41:10)"
  },
  {
    palavras: ["me sinto inútil", "não sirvo para nada", "não sou bom em nada"],
    resposta: "Você é útil e amado(a) por Deus. Ele tem planos lindos para sua vida (Jeremias 29:11).",
    versiculo: "“Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor, pensamentos de paz e não de mal, para vos dar o fim que esperais.” (Jeremias 29:11)"
  },
  {
    palavras: ["não consigo sair da cama", "não tenho forças para levantar", "não quero levantar da cama"],
    resposta: "Deus pode renovar suas forças a cada manhã. Ele está com você (Isaías 40:31).",
    versiculo: "“Mas os que esperam no Senhor renovarão as suas forças. Eles subirão com asas como águias; correrão, e não se cansarão; andarão, e não se fatigarão.” (Isaías 40:31)"
  },
  {
    palavras: ["me sinto pesado", "me sinto pesada", "carrego um peso enorme"],
    resposta: "Entregue seus fardos a Deus. Ele te alivia e te dá descanso (Mateus 11:28-30).",
    versiculo: "“Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.” (Mateus 11:28)"
  },
  {
    palavras: ["não tenho vontade de conversar", "não quero falar com ninguém", "quero ficar sozinho"],
    resposta: "Mesmo no silêncio, Deus ouve seu coração. Ele está com você (Salmo 139:1-4).",
    versiculo: "“Senhor, tu me sondas e me conheces. Sabes quando me assento e quando me levanto; de longe penetras meus pensamentos.” (Salmo 139:1-2)"
  },
  {
    palavras: ["me sinto incapaz", "não sou capaz", "não consigo fazer nada direito"],
    resposta: "Você pode todas as coisas naquele que te fortalece (Filipinas 4:13).",
    versiculo: "“Tudo posso naquele que me fortalece.” (Filipinas 4:13)"
  },
  {
    palavras: ["não tenho mais alegria", "não sinto alegria", "não sou feliz"],
    resposta: "A alegria do Senhor é a a sua força. Ele pode restaurar sua felicidade (Neemias 8:10).",
    versiculo: "“Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos.” (Filipenses 4:4)"
  },
  {
    palavras: ["me sinto esquecido", "ninguém lembra de mim", "sou esquecido por todos"],
    resposta: "Deus nunca se esquece de você. Ele te tem gravado na palma das mãos (Isaías 49:16).",
    versiculo: "“Pode uma mulher esquecer-se do filho que ainda mama, de maneira que não se compadeça do filho do seu ventre? Mas ainda que esta viesse a esquecer-se dele, eu, todavia, me não esquecerei de ti.” (Isaías 49:15)"
  },
  {
    palavras: ["não tenho mais vontade de sair", "não quero sair de casa", "não quero ver ninguém"],
    resposta: "Deus entende seu momento e está com você em todo lugar (Salmo 139:7-10).",
    versiculo: "“Para onde me irei do teu espírito, ou para onde fugirei da tua face?” (Salmo 139:7)"
  },
  {
    palavras: ["me sinto preso", "me sinto presa", "não consigo me libertar"],
    resposta: "Deus é libertador. Ele quebra correntes e traz liberdade (João 8:36).",
    versiculo: "“Se, pois, o Filho vos libertar, verdadeiramente sereis livres.” (João 8:36)"
  },
  {
    palavras: ["não tenho mais vontade de estudar", "não quero estudar", "não consigo estudar"],
    resposta: "Deus pode renovar seu ânimo e te ajudar a vencer cada desafio (Tiago 1:5).",
    versiculo: "“Se algum de vocês tem falta de sabedoria, peça a Deus, que a todos dá liberalmente e nada lhes impropera, e ser-lhe-á dada.” (Tiago 1:5)"
  },
  {
    palavras: ["me sinto sem energia", "não tenho energia para nada", "estou exausto"],
    resposta: "Deus renova as forças dos cansados. Ele é sua fonte de energia (Isaías 40:29).",
    versiculo: "“Ele dá força ao cansado e aumenta as forças daquele que não tem nenhum vigor.” (Isaías 40:29)"
  },
  {
    palavras: ["não tenho mais vontade de trabalhar", "não quero trabalhar", "não consigo trabalhar"],
    resposta: "Deus abençoa o trabalho das suas mãos e te dá ânimo (Salmo 90:17).",
    versiculo: "“E tudo o que fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens.” (Colossenses 3:23)"
  },
  {
    palavras: ["me sinto desmotivado", "não tenho motivação para nada", "não quero fazer nada"],
    resposta: "Deus pode renovar sua motivação e te dar novos sonhos (Salmo 37:4).",
    versiculo: "“Deleita-te também no Senhor, e te concederá os desejos do teu coração.” (Salmo 37:4)"
  },
  {
    palavras: ["não tenho mais vontade de viver", "não quero mais viver", "não vejo mais sentido em viver"],
    resposta: "Sua vida é preciosa para Deus. Se estiver pensando em se machucar, procure ajuda imediatamente: CVV 188 ou Instituto Crer+Ser 21 98740-1651. Deus te ama profundamente (Salmo 118:17).",
    versiculo: "“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.” (Isaías 41:10)"
  },
  {
    palavras: ["me sinto sem chão", "não tenho base", "tudo desmoronou"],
    resposta: "Deus é a sua rocha e fundamento. Ele te sustenta mesmo nas tempestades (Salmo 18:2).",
    versiculo: "“O Senhor é a minha rocha, a minha fortaleza e o meu libertador.” (Salmo 18:2)"
  },
  {
    palavras: ["não tenho mais vontade de sonhar", "não quero sonhar", "não acredito mais em sonhos"],
    resposta: "Deus pode restaurar seus sonhos e te dar esperança (Jeremias 29:11).",
    versiculo: "“Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.” (Jeremias 29:11)"
  },
  {
    palavras: ["me sinto sem direção", "não sei para onde ir", "estou perdido"],
    resposta: "Deus é o seu guia e te mostra o caminho (Salmo 32:8).",
    versiculo: "“Eu te instruirei e te ensinarei o caminho que deves seguir; eu te darei conselhos e cuidarei de você.” (Salmo 32:8)"
  },
  {
    palavras: ["não tenho mais vontade de lutar", "não quero lutar", "não consigo lutar"],
    resposta: "Deus luta por você e te fortalece (Êxodo 14:14).",
    versiculo: "“O Senhor pelejará por vós, e vós vos calareis.” (Êxodo 14:14)"
  },
  {
    palavras: ["me sinto sem esperança", "não tenho esperança", "perdi a esperança"],
    resposta: "Deus é Deus de esperança. Ele pode renovar sua fé e alegria (Romanos 15:13).",
    versiculo: "“E o Deus da esperança vos encha de toda alegria e paz na vossa fé, para que abundeis em esperança pelo poder do Espírito Santo.” (Romanos 15:13)"
  },
  {
    palavras: ["não tenho mais vontade de sorrir", "não quero sorrir", "não consigo sorrir"],
    resposta: "Deus pode restaurar seu sorriso e sua alegria (Salmo 126:2).",
    versiculo: "“Alegrai-vos com os que se alegram; chorai com os que choram.” (Romanos 12:15)"
  },
  {
    palavras: ["me sinto sem amor", "não sou amado", "ninguém me ama"],
    resposta: "Deus te ama com amor eterno. Você é muito amado(a) (Jeremias 31:3).",
    versiculo: "“Com amor eterno eu te amei; por isso, com benignidade te atraí.” (Jeremias 31:3)"
  },
  {
    palavras: ["não tenho mais vontade de viver", "não quero mais viver", "não vejo mais sentido em viver"],
    resposta: "Sua vida é preciosa para Deus. Se estiver pensando em se machucar, procure ajuda imediatamente: CVV 188 ou Instituto Crer+Ser 21 98740-1651. Deus te ama profundamente (Salmo 118:17).",
    versiculo: "“Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.” (Isaías 41:10)"
  }
];

let userName = null;

function iaOffline(userMsg) {
  const lower = userMsg.toLowerCase();
  const aberturas = shuffle([
    "Eu entendo como isso pode ser doloroso.",
    "Imagino o quanto isso pesa no seu coração.",
    "Sei que não é fácil passar por isso.",
    "Sinto muito que esteja enfrentando esse momento.",
    "Reconheço sua coragem em compartilhar isso.",
    "Você não está sozinho nessa jornada.",
    "Sua dor é válida e importante.",
    "Obrigado por confiar em mim para compartilhar isso."
  ]);
  const encerramentos = shuffle([
    "Estou aqui para você. Se quiser, continue compartilhando.",
    "Se sentir necessidade, busque apoio de um profissional. Você merece cuidado.",
    "Conte comigo para conversar sempre que precisar.",
    "Se quiser falar mais, estou à disposição.",
    "Lembre-se: pedir ajuda é um ato de coragem.",
    "O Instituto Crer+Ser está sempre disponível para te ouvir.",
    "Você pode contar com o Instituto Crer+Ser sempre que precisar."
  ]);
  const versiculo = versiculos[Math.floor(Math.random() * versiculos.length)];
  const oracao = userName
    ? `Senhor, acolhe o coração de ${userName}, traz paz, esperança e força. Que Tua presença seja real neste momento. Amém.`
    : "Senhor, acolhe este coração, traz paz, esperança e força. Que Tua presença seja real neste momento. Amém.";
  let melhorGatilho = null;
  let maiorMatch = 0;
  for (const gatilho of gatilhosCristaos) {
    for (const palavra of gatilho.palavras) {
      if (lower.includes(palavra) && palavra.length > maiorMatch) {
        melhorGatilho = gatilho;
        maiorMatch = palavra.length;
      }
    }
  }
  if (melhorGatilho) {
    const versiculoGatilho = melhorGatilho.versiculo || versiculos[Math.floor(Math.random() * versiculos.length)];
    return `${aberturas.pop()}\n\n"${versiculoGatilho}"\n\n${melhorGatilho.resposta}\n\n${oracao}\n\n${encerramentos.pop()}`;
  }
  if (lower.includes('suicídio') || lower.includes('suicidio') || lower.includes('me matar') || lower.includes('acabar com minha vida')) {
    return `${aberturas.pop()}\n\n"${versiculo}"\n\nSinto muito que esteja pensando nisso. Se você estiver pensando em se machucar, ligue para o Centro de Valorização da Vida – 188, Instituto Crer + Ser: 21 98740-1651, ou procure ajuda médica agora mesmo. Deus está com você.\n\n${oracao}\n\n${encerramentos.pop()}`;
  }
  if (lower.includes('oração') || lower.includes('orar')) {
    return `${aberturas.pop()}\n\n"${versiculo}"\n\nVamos orar juntos${userName ? ', ' + userName : ''}:\nSenhor Deus, neste momento eu Te peço que acolhas este coração aflito. Que Tua presença traga paz, esperança e força para enfrentar cada desafio. Renova o ânimo, consola as dores, ilumina os pensamentos e derrama Teu amor sobre cada área da vida. Que o Teu Espírito Santo envolva, cure e fortaleça. Que a certeza do Teu cuidado seja maior do que qualquer medo ou tristeza. Em nome de Jesus, amém.\n\n${encerramentos.pop()}`;
  }
  if (lower.includes('versículo') || lower.includes('versiculo')) {
    return `${aberturas.pop()}\n\n"${versiculo}"\n\n${oracao}\n\n${encerramentos.pop()}`;
  }
  return `${aberturas.pop()}\n\n"${versiculo}"\n\n${respostasPadrao[Math.floor(Math.random() * respostasPadrao.length)]}\n\n${oracao}\n\n${encerramentos.pop()}`;
}

// Mensagem de início personalizada
const mensagemInicio = () =>
  userName
    ? `Olá, ${userName}! Eu sou o Instituto Crer+Ser, seu assistente virtual cristão. Como posso te ajudar hoje?`
    : 'Olá! Eu sou o Instituto Crer+Ser, seu assistente virtual cristão. Como posso te ajudar hoje?';

app.post('/chat', async (req, res) => {
  try {
    if (!req.body || typeof req.body.message !== 'string') {
      console.error('Requisição inválida:', req.body);
      return res.status(400).json({ error: 'Mensagem inválida.' });
    }
    const userMsg = req.body.message;
    console.log('Mensagem recebida:', userMsg);
    // Detecta nome
    const match = userMsg.match(/meu nome é ([A-Za-zÀ-ÿ]+)/i) || userMsg.match(/eu sou ([A-Za-zÀ-ÿ]+)/i);
    if (match && match[1]) {
      userName = match[1];
      return res.json({ message: `Olá, ${userName}! Como posso te ajudar hoje?` });
    }

    // Resposta da IA (fluxo normal)
    const resposta = iaOffline(userMsg);
    res.json({ message: resposta });
  } catch (error) {
    console.error('Erro no processamento da mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor rodando na porta', process.env.PORT || 3000);
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
