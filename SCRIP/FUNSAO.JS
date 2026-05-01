/* ══════════════════════════════════════════
   FUNSAO.JS — Oh Barbeiro
   Lê serviços e preços do localStorage (admin)
══════════════════════════════════════════ */

const SEU_WHATSAPP = "5583996529337";

const TODOS_HORARIOS = [
  "08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00"
];

// Serviços padrão caso o admin ainda não tenha salvo nada
const SERVICOS_PADRAO = [
  { nome: "Corte de Cabelo", preco: 30,  gratis: false },
  { nome: "Barba",           preco: 20,  gratis: false },
  { nome: "Pigmentação",     preco: 40,  gratis: false },
  { nome: "Sobrancelha",     preco: 0,   gratis: true  },
  { nome: "SELAGEM",         preco: 40,  gratis: false },
  { nome: "Relaxamento",     preco: 25,  gratis: false },
  { nome: "NEVOU",           preco: 50,  gratis: false },
  { nome: "LUZES",           preco: 35,  gratis: false },
];

/* ══════════════════════════════════════════
   VARIÁVEIS GLOBAIS
══════════════════════════════════════════ */

let servicosSelecionados = [];
let totalGeral = 0;

/* ══════════════════════════════════════════
   PEGA SERVIÇOS DO LOCALSTORAGE (ou padrão)
══════════════════════════════════════════ */

function getServicos() {
  const salvo = localStorage.getItem("ohbarbeiro_servicos");
  return salvo ? JSON.parse(salvo) : SERVICOS_PADRAO;
}

/* ══════════════════════════════════════════
   GERA O GRID DE SERVIÇOS DINAMICAMENTE
   (substitui o HTML fixo do index.html)
══════════════════════════════════════════ */

function gerarGridServicos() {
  const grid = document.getElementById("servicos-grid");
  if (!grid) return;

  const servicos = getServicos();
  grid.innerHTML = "";

  servicos.forEach(function (s) {
    const div = document.createElement("div");
    div.className = "servico";
    div.setAttribute("data-servico", s.nome);
    div.setAttribute("data-preco", s.preco);

    const precoHTML = s.gratis
      ? '<span class="preco gratis">GRÁTIS</span>'
      : '<span class="preco">R$ ' + s.preco.toFixed(2).replace(".", ",") + '</span>';

    div.innerHTML = '<span class="servico-icon"></span><strong>' + s.nome + '</strong>' + precoHTML;

    div.addEventListener("click", function () {
      const nome  = div.getAttribute("data-servico");
      const preco = parseFloat(div.getAttribute("data-preco"));
      const jaEsta = servicosSelecionados.some(function (x) { return x.nome === nome; });

      if (jaEsta) {
        servicosSelecionados = servicosSelecionados.filter(function (x) { return x.nome !== nome; });
        totalGeral -= preco;
        div.classList.remove("selecionado");
      } else {
        servicosSelecionados.push({ nome: nome, preco: preco });
        totalGeral += preco;
        div.classList.add("selecionado");
      }

      atualizarTotal();
      esconderErro();
    });

    grid.appendChild(div);
  });
}

/* ══════════════════════════════════════════
   AO CARREGAR A PÁGINA
══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", function () {

  // Gera os cards de serviço com preços do localStorage
  gerarGridServicos();

  // Data mínima = hoje
  const hoje = new Date();
  const hojeISO = hoje.toISOString().split("T")[0];
  document.getElementById("data").setAttribute("min", hojeISO);

  // Muda de data → verifica domingo e carrega horários
  document.getElementById("data").addEventListener("change", function () {
    verificarDomingo(this.value);
    carregarHorarios(this.value);
  });

  // Remove erros ao digitar
  document.querySelectorAll("input, textarea").forEach(function (campo) {
    campo.addEventListener("input", esconderErro);
  });
});

/* ══════════════════════════════════════════
   SISTEMA DE HORÁRIOS
══════════════════════════════════════════ */

function chaveReserva(data) {
  return "ohbarbeiro_reservas_" + data;
}

function getReservados(data) {
  const salvo = localStorage.getItem(chaveReserva(data));
  return salvo ? JSON.parse(salvo) : [];
}

function reservarHorario(data, horario) {
  const reservados = getReservados(data);
  if (!reservados.includes(horario)) {
    reservados.push(horario);
    localStorage.setItem(chaveReserva(data), JSON.stringify(reservados));
  }
}

function verificarDomingo(dataISO) {
  if (!dataISO) return false;
  const data  = new Date(dataISO + "T12:00:00");
  const aviso = document.getElementById("aviso-domingo");
  const grade = document.getElementById("grade-horarios");

  if (data.getDay() === 0) {
    aviso.classList.remove("escondido");
    grade.innerHTML = '<p class="hint-horario">Escolha outro dia 😊</p>';
    document.getElementById("horario-selecionado").value = "";
    return true;
  } else {
    aviso.classList.add("escondido");
    return false;
  }
}

function carregarHorarios(dataISO) {
  if (!dataISO) return;
  if (verificarDomingo(dataISO)) return;

  const grade      = document.getElementById("grade-horarios");
  const reservados = getReservados(dataISO);
  grade.innerHTML  = "";

  TODOS_HORARIOS.forEach(function (hora) {
    const btn = document.createElement("button");
    btn.type        = "button";
    btn.textContent = hora;
    btn.className   = "btn-horario";

    if (reservados.includes(hora)) {
      btn.classList.add("ocupado");
      btn.disabled = true;
      btn.title    = "Horário já reservado";
    } else {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".btn-horario").forEach(function (b) {
          b.classList.remove("ativo");
        });
        btn.classList.add("ativo");
        document.getElementById("horario-selecionado").value = hora;
        esconderErro();
      });
    }

    grade.appendChild(btn);
  });
}

/* ══════════════════════════════════════════
   TOTAL DOS SERVIÇOS
══════════════════════════════════════════ */

function atualizarTotal() {
  const caixa = document.getElementById("caixa-total");
  const span  = document.getElementById("valor-total");

  if (servicosSelecionados.length === 0) {
    caixa.classList.add("escondido");
    totalGeral = 0;
  } else {
    caixa.classList.remove("escondido");
    span.textContent = totalGeral === 0
      ? "GRÁTIS 🎉"
      : "R$ " + totalGeral.toFixed(2).replace(".", ",");
  }
}

/* ══════════════════════════════════════════
   FATURAMENTO
══════════════════════════════════════════ */

function registrarFaturamento(dataISO, valor) {
  const chaveDia = "ohbarbeiro_fat_" + dataISO;
  const atualDia = parseFloat(localStorage.getItem(chaveDia) || "0");
  localStorage.setItem(chaveDia, (atualDia + valor).toFixed(2));

  const mes      = dataISO.substring(0, 7);
  const chaveMes = "ohbarbeiro_fat_mes_" + mes;
  const atualMes = parseFloat(localStorage.getItem(chaveMes) || "0");
  localStorage.setItem(chaveMes, (atualMes + valor).toFixed(2));
}

/* ══════════════════════════════════════════
   FUNÇÃO PRINCIPAL: AGENDAR
══════════════════════════════════════════ */

function agendar() {
  const nome    = document.getElementById("nome").value.trim();
  const tel     = document.getElementById("telefone").value.trim();
  const data    = document.getElementById("data").value;
  const horario = document.getElementById("horario-selecionado").value;
  const obs     = document.getElementById("obs").value.trim();

  if (!nome)    { mostrarErro("Por favor, informe seu nome! 😊");                       return; }
  if (!tel)     { mostrarErro("Por favor, informe seu WhatsApp! 📱");                   return; }
  if (servicosSelecionados.length === 0) { mostrarErro("Selecione pelo menos um serviço! ✂️"); return; }
  if (!data)    { mostrarErro("Escolha uma data! 📅");                                  return; }

  const diaSemana = new Date(data + "T12:00:00").getDay();
  if (diaSemana === 0) { mostrarErro("Não trabalhamos aos domingos! ⛔");               return; }
  if (!horario) { mostrarErro("Escolha um horário disponível! ⏰");                     return; }

  const dataFormatada  = formatarData(data);

  const listaServicos = servicosSelecionados.map(function (s) {
    return "• " + s.nome + (s.preco === 0 ? " — GRÁTIS" : " — R$ " + s.preco.toFixed(2).replace(".", ","));
  }).join("\n");

  const totalFormatado = totalGeral === 0
    ? "GRÁTIS"
    : "R$ " + totalGeral.toFixed(2).replace(".", ",");

  let msg =
    "✂️ *NOVO AGENDAMENTO - OH BARBEIRO* ✂️\n\n" +
    "👤 *Nome:* "      + nome           + "\n" +
    "💈 *Serviços:*\n" + listaServicos  + "\n\n" +
    "💰 *Total:* "     + totalFormatado + "\n\n" +
    "📅 *Data:* "      + dataFormatada  + "\n" +
    "⏰ *Horário:* "   + horario;

  if (obs) msg += "\n\n📝 *Obs:* " + obs;
  msg += "\n\n_Agendado pelo site Oh Barbeiro_ 🔥";

  reservarHorario(data, horario);
  registrarFaturamento(data, totalGeral);
  carregarHorarios(data);

  window.open("https://wa.me/" + SEU_WHATSAPP + "?text=" + encodeURIComponent(msg), "_blank");
}

/* ══════════════════════════════════════════
   AUXILIARES
══════════════════════════════════════════ */

function formatarData(iso) {
  const p = iso.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function mostrarErro(texto) {
  let el = document.getElementById("msg-erro");
  if (!el) {
    el = document.createElement("p");
    el.id = "msg-erro";
    document.getElementById("btn-agendar").after(el);
  }
  el.textContent   = texto;
  el.style.display = "block";
}

function esconderErro() {
  const el = document.getElementById("msg-erro");
  if (el) el.style.display = "none";
}
