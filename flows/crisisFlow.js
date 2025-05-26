// crisisFlow.js

// Lista ampliada de termos que indicam risco de suicídio
const crisisKeywords = [
  'suicidar', 'morrer', 'acabar com minha vida', 'tirar minha vida',
  'não aguento mais', 'quero sumir', 'quero morrer', 'não vejo saída',
  'me matar', 'me machucar', 'autoextermínio', 'autoexterminio',
  'não quero mais viver', 'dar fim à minha vida', 'dar fim a minha vida',
  'pensando em morrer', 'pensando em suicídio', 'pensando em suicidio',
  'pensando em acabar com tudo', 'não quero mais estar aqui',
  'não quero mais existir', 'não vejo sentido', 'não vejo sentido na vida'
];

// Função para extrair nome do usuário (exemplo simples)
function extractName(text) {
  // Busca por frases como "meu nome é ..." ou "eu sou o ..."
  const match = text.match(/meu nome é ([A-Za-zÀ-ÿ]+)/i) || text.match(/eu sou o ([A-Za-zÀ-ÿ]+)/i) || text.match(/eu sou a ([A-Za-zÀ-ÿ]+)/i);
  return match ? match[1] : null;
}

let userName = null;

export function handleCrisis(text, res) {
  const lower = text.toLowerCase();
  // Tenta extrair nome
  const name = extractName(text);
  if (name) {
    userName = name;
    console.log('Nome detectado:', userName);
  }
  if (crisisKeywords.some(k => lower.includes(k))) {
    // resposta imediata de crise
    const msg = `
Sinto muito que você esteja passando por isso. Você não está sozinho.
📞 Se estiver em perigo imediato, ligue para o SAMU (192).
🌷 Se preferir conversar agora, ligue para o CVV no 188 — é gratuito e funciona 24h.
📱 Instituto Crer + Ser: 21 98740-1651
“Deus está perto dos que têm o coração quebrantado.” (Sl 34:18)
    `;
    res.json({ reply: msg });
    return true;
  }
  return false;
}
